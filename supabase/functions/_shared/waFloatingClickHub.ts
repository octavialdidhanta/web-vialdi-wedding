import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { propertyCreatedByName } from "./propertyCreatedByName.ts";

const FORM_ID = "contact-main";
const PACKAGE_LABEL_CLICK = "WhatsApp (klik)";
/** Placeholder until inbound WA or form provides a real name (replaced by webhook). */
export const WA_FLOATING_STUB_CLIENT = "—";

export function buildWaFloatingFunnelKey(webId: string): string {
  return `wa-floating:${webId}`.slice(0, 200);
}

function mergeFormDataFloating(
  existing: Record<string, unknown> | null | undefined,
  path: string,
  targetUrl: string | null,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing) ? { ...existing } : {};
  return {
    ...base,
    source: "floating_whatsapp",
    path,
    ...(targetUrl ? { target_url: targetUrl } : {}),
  };
}

function submissionHasPii(row: {
  name?: unknown;
  phone_number?: unknown;
  email?: unknown;
} | null): boolean {
  if (!row) return false;
  const name = row.name != null ? String(row.name).trim() : "";
  const phone = row.phone_number != null ? String(row.phone_number).trim() : "";
  const email = row.email != null ? String(row.email).trim() : "";
  return Boolean(name && phone && email);
}

export type SyncWaFloatingClickResult =
  | { ok: true; lead_id: string; submission_id: string; skipped?: false }
  | { ok: false; error: string; skipped?: boolean };

/**
 * On floating WhatsApp click: upsert CRM lead stub + hub draft submission (one row per session).
 * Non-fatal callers should catch errors; does not throw on missing form_definitions.
 */
export async function syncWaFloatingClickToHub(args: {
  admin: SupabaseClient;
  organizationId: string;
  webId: string;
  systemUserId: string;
  analyticsSessionId: string;
  attribution: Record<string, unknown> | null;
  gclid?: string | null;
  path: string;
  targetUrl: string | null;
  packageLabel?: string | null;
  formVersion?: number;
  propertyDisplayName?: string | null;
}): Promise<SyncWaFloatingClickResult> {
  const sessionId = args.analyticsSessionId.trim();
  if (!sessionId) return { ok: false, error: "analytics_session_id required" };

  const { data: formDef, error: formErr } = await args.admin
    .from("form_definitions")
    .select("version")
    .eq("web_id", args.webId)
    .eq("form_id", FORM_ID)
    .eq("is_active", true)
    .maybeSingle();

  if (formErr) return { ok: false, error: formErr.message };
  if (!formDef) {
    console.warn("syncWaFloatingClickToHub: hub_sync_skipped no contact-main", {
      web_id: args.webId,
    });
    return { ok: false, error: "form_definitions missing", skipped: true };
  }

  const formVersion = args.formVersion ?? (Number(formDef.version) || 1);
  const funnelKey = buildWaFloatingFunnelKey(args.webId);
  const pkgLabel = (args.packageLabel ?? PACKAGE_LABEL_CLICK).trim() || PACKAGE_LABEL_CLICK;

  const { data: existingSub } = await args.admin
    .from("lead_submissions")
    .select("id, lead_id, name, phone_number, email, form_data, package_label")
    .eq("web_id", args.webId)
    .eq("organization_id", args.organizationId)
    .eq("analytics_session_id", sessionId)
    .eq("form_id", FORM_ID)
    .eq("status", "draft")
    .maybeSingle();

  const hasPii = submissionHasPii(existingSub);
  const mergedFormData = mergeFormDataFloating(
    existingSub?.form_data as Record<string, unknown> | undefined,
    args.path,
    args.targetUrl,
  );

  let leadId =
    existingSub?.lead_id != null && String(existingSub.lead_id).trim()
      ? String(existingSub.lead_id).trim()
      : null;

  if (!leadId) {
    const leadPayload: Record<string, unknown> = {
      client: WA_FLOATING_STUB_CLIENT,
      title: "WhatsApp floating",
      category: "WhatsApp floating",
      created_by: args.systemUserId,
      created_by_name: propertyCreatedByName(args.propertyDisplayName, args.webId),
      assignee: "",
      followup: 0,
      organization_id: args.organizationId,
      source: "WhatsApp floating click",
      web_id: args.webId,
      funnel_key: funnelKey,
      analytics_session_id: sessionId,
      ...(args.attribution ? { attribution: args.attribution } : {}),
      ...(args.gclid ? { gclid: args.gclid } : {}),
    };

    const { data: lead, error: leadErr } = await args.admin
      .from("leads")
      .upsert(leadPayload, { onConflict: "organization_id,dedupe_key" })
      .select("id")
      .single();

    if (leadErr || !lead?.id) {
      return { ok: false, error: leadErr?.message ?? "Failed to upsert lead" };
    }
    leadId = String(lead.id);
  } else {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (args.attribution) patch.attribution = args.attribution;
    if (args.gclid) patch.gclid = args.gclid;
    patch.analytics_session_id = sessionId;
    patch.web_id = args.webId;
    const { error: patchErr } = await args.admin.from("leads").update(patch).eq("id", leadId);
    if (patchErr) {
      return { ok: false, error: patchErr.message };
    }
  }

  const submissionPatch: Record<string, unknown> = {
    web_id: args.webId,
    form_id: FORM_ID,
    form_version: formVersion,
    step: 1,
    status: "draft",
    form_data: mergedFormData,
    organization_id: args.organizationId,
    lead_id: leadId,
    analytics_session_id: sessionId,
    attribution: args.attribution,
    ...(args.gclid ? { gclid: args.gclid } : {}),
  };

  if (!hasPii) {
    submissionPatch.package_label = pkgLabel;
  }

  let submissionId: string | null = existingSub?.id != null ? String(existingSub.id) : null;
  if (submissionId) {
    const { error: subUpdErr } = await args.admin
      .from("lead_submissions")
      .update(submissionPatch)
      .eq("id", submissionId);
    if (subUpdErr) {
      return { ok: false, error: subUpdErr.message };
    }
  } else {
    const { data: sub, error: subErr } = await args.admin
      .from("lead_submissions")
      .insert(submissionPatch)
      .select("id")
      .single();
    if (subErr || !sub?.id) {
      return { ok: false, error: subErr?.message ?? "Failed to insert lead_submissions" };
    }
    submissionId = String(sub.id);
  }

  if (!submissionId) {
    return { ok: false, error: "Failed to persist lead_submissions" };
  }

  console.log("syncWaFloatingClickToHub: hub_sync_ok", {
    web_id: args.webId,
    lead_id: leadId,
    submission_id: submissionId,
  });

  return { ok: true, lead_id: leadId, submission_id: submissionId };
}
