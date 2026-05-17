/**
 * Hub Edge: contact-submit — generic multi-step form for all properties.
 */
import { attributionToJsonb, parseLeadAttribution } from "./attribution.ts";
import { corsPreflightHeaders, jsonResponse } from "./cors.ts";
import { syncCrmLeadStep1, updateCrmLeadFromSubmission } from "./crmLeadSync.ts";
import { applyCrmMapping } from "./extractDenormalized.ts";
import { clientIpFromRequest, rateLimitByWebId } from "./rateLimitByWebId.ts";
import { resolveActiveProperty } from "./resolveWebId.ts";
import { createServiceClient, mustGetEnv } from "./supabaseAdmin.ts";
import {
  getMaxStep,
  getStepFields,
  parseFormSchema,
  validateFormStep,
} from "./validateFormStep.ts";

type SubmitBody = {
  web_id: string;
  form_id: string;
  step: number;
  id?: string;
  form_data: Record<string, unknown>;
  package_label?: string;
  attribution?: unknown;
  analytics_session_id?: string;
};

function mergeFormData(
  existing: Record<string, unknown>,
  stepPatch: Record<string, unknown>,
): Record<string, unknown> {
  return { ...existing, ...stepPatch };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsPreflightHeaders(origin) });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 }, origin);
  }

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 }, origin);
  }

  const admin = createServiceClient();

  const resolved = await resolveActiveProperty(admin, body.web_id);
  if (!resolved.ok) {
    return jsonResponse({ error: resolved.error }, { status: resolved.status }, origin);
  }
  const property = resolved.property;

  const rl = await rateLimitByWebId(admin, property.slug, clientIpFromRequest(req));
  if (!rl.ok) {
    return jsonResponse(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      origin,
    );
  }

  const formId = typeof body.form_id === "string" ? body.form_id.trim() : "";
  if (!formId) {
    return jsonResponse({ error: "form_id required" }, { status: 400 }, origin);
  }

  const step = Number(body.step);
  if (!Number.isInteger(step) || step < 1) {
    return jsonResponse({ error: "Invalid step" }, { status: 400 }, origin);
  }

  const { data: formDef, error: formErr } = await admin
    .from("form_definitions")
    .select("id, version, schema, crm_mapping, is_active")
    .eq("web_id", property.slug)
    .eq("form_id", formId)
    .eq("is_active", true)
    .maybeSingle();

  if (formErr || !formDef) {
    return jsonResponse({ error: "Form not found" }, { status: 400 }, origin);
  }

  const schema = parseFormSchema(formDef.schema);
  if (!schema) {
    return jsonResponse({ error: "Invalid form schema" }, { status: 500 }, origin);
  }

  const fields = getStepFields(schema, step);
  if (!fields) {
    return jsonResponse({ error: "Invalid step for form" }, { status: 400 }, origin);
  }

  const formDataIn =
    body.form_data && typeof body.form_data === "object" && !Array.isArray(body.form_data)
      ? body.form_data
      : {};

  const validated = validateFormStep(fields, formDataIn);
  if (!validated.ok) {
    return jsonResponse({ error: validated.error }, { status: 400 }, origin);
  }

  if (validated.honeypotTriggered) {
    return jsonResponse({ ok: true, submission_id: null, lead_id: null }, { status: 200 }, origin);
  }

  const maxStep = getMaxStep(schema);
  const isFinalStep = step >= maxStep;

  if (isFinalStep) {
    if (typeof body.analytics_session_id !== "string" || !body.analytics_session_id.trim()) {
      return jsonResponse(
        { error: "analytics_session_id required on final step" },
        { status: 400 },
        origin,
      );
    }
    if (body.attribution === undefined || body.attribution === null) {
      return jsonResponse({ error: "attribution required on final step" }, { status: 400 }, origin);
    }
    const parsedAttr = parseLeadAttribution(body.attribution);
    if (!parsedAttr) {
      return jsonResponse({ error: "Invalid attribution" }, { status: 400 }, origin);
    }
  }

  let systemUserId: string;
  try {
    systemUserId = mustGetEnv("SYSTEM_USER_ID");
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, { status: 500 }, origin);
  }

  const crmMapping = (formDef.crm_mapping ?? {}) as Record<string, unknown>;
  const submissionId = typeof body.id === "string" && body.id.trim() ? body.id.trim() : undefined;

  let existingRow: Record<string, unknown> | null = null;
  if (submissionId) {
    const { data: row, error: loadErr } = await admin
      .from("lead_submissions")
      .select("*")
      .eq("id", submissionId)
      .maybeSingle();
    if (loadErr || !row) {
      return jsonResponse({ error: "Submission not found" }, { status: 400 }, origin);
    }
    if (String(row.web_id) !== property.slug || String(row.form_id) !== formId) {
      return jsonResponse({ error: "Submission not valid" }, { status: 400 }, origin);
    }
    existingRow = row as Record<string, unknown>;
  }

  const merged = mergeFormData(
    (existingRow?.form_data as Record<string, unknown>) ?? {},
    validated.sanitized,
  );

  const denorm = applyCrmMapping(merged, crmMapping);
  const packageLabel =
    (typeof body.package_label === "string" && body.package_label.trim()) ||
    denorm.package_label ||
    null;

  const parsedAttrFinal = isFinalStep ? parseLeadAttribution(body.attribution) : null;

  let leadId = typeof existingRow?.lead_id === "string" ? String(existingRow.lead_id) : null;
  let identityHash =
    typeof existingRow?.identity_hash === "string" ? String(existingRow.identity_hash) : null;

  const name = denorm.name ?? "";
  const phone = denorm.phone_number ?? "";
  const email = denorm.email ?? "";

  if (step === 1 && name && phone && email) {
    const crm = await syncCrmLeadStep1({
      admin,
      systemUserId,
      organizationId: property.organization_id,
      webId: property.slug,
      formId,
      name,
      phone_number: phone,
      email,
      package_label: packageLabel,
      analytics_session_id: body.analytics_session_id ?? null,
      attribution: parsedAttrFinal ? attributionToJsonb(parsedAttrFinal.attribution) : null,
      attribution_label: parsedAttrFinal?.label ?? null,
    });
    if (!crm.ok) {
      return jsonResponse({ error: crm.error }, { status: 500 }, origin);
    }
    leadId = crm.leadId;
    identityHash = crm.identityHash;
  }

  const rowPatch: Record<string, unknown> = {
    web_id: property.slug,
    form_id: formId,
    form_version: formDef.version,
    step,
    form_data: merged,
    name: denorm.name,
    phone_number: denorm.phone_number,
    email: denorm.email,
    package_label: packageLabel,
    organization_id: property.organization_id,
    lead_id: leadId,
    identity_hash: identityHash,
    status: isFinalStep ? "submitted" : "draft",
    submitted_at: isFinalStep ? new Date().toISOString() : null,
  };

  if (isFinalStep) {
    rowPatch.analytics_session_id = body.analytics_session_id!.trim();
    if (parsedAttrFinal) {
      rowPatch.attribution = attributionToJsonb(parsedAttrFinal.attribution);
      rowPatch.attribution_label = parsedAttrFinal.label;
    }
  } else if (body.analytics_session_id) {
    rowPatch.analytics_session_id = body.analytics_session_id.trim();
  }

  let savedId: string;

  if (submissionId) {
    const { data: updated, error: upErr } = await admin
      .from("lead_submissions")
      .update(rowPatch)
      .eq("id", submissionId)
      .select("id, lead_id")
      .single();
    if (upErr || !updated) {
      return jsonResponse({ error: upErr?.message ?? "Update failed" }, { status: 500 }, origin);
    }
    savedId = String(updated.id);
    leadId = updated.lead_id ? String(updated.lead_id) : leadId;
  } else if (
    step === 1 &&
    rowPatch.analytics_session_id &&
    rowPatch.status === "draft"
  ) {
    const { data: upserted, error: upErr } = await admin
      .from("lead_submissions")
      .upsert(rowPatch, { onConflict: "web_id,organization_id,step1_dedupe_key" })
      .select("id, lead_id")
      .single();
    if (upErr || !upserted) {
      return jsonResponse({ error: upErr?.message ?? "Upsert failed" }, { status: 500 }, origin);
    }
    savedId = String(upserted.id);
    leadId = upserted.lead_id ? String(upserted.lead_id) : leadId;
  } else {
    const { data: inserted, error: insErr } = await admin
      .from("lead_submissions")
      .insert(rowPatch)
      .select("id, lead_id")
      .single();
    if (insErr || !inserted) {
      return jsonResponse({ error: insErr?.message ?? "Insert failed" }, { status: 500 }, origin);
    }
    savedId = String(inserted.id);
    leadId = inserted.lead_id ? String(inserted.lead_id) : leadId;
  }

  if (isFinalStep && leadId) {
    await updateCrmLeadFromSubmission({
      admin,
      leadId,
      organizationId: property.organization_id,
      mergedFormData: merged,
      package_label: packageLabel,
      attribution: parsedAttrFinal ? attributionToJsonb(parsedAttrFinal.attribution) : null,
      attribution_label: parsedAttrFinal?.label ?? null,
    });
  }

  return jsonResponse(
    { submission_id: savedId, lead_id: leadId, id: savedId },
    { status: 200 },
    origin,
  );
});
