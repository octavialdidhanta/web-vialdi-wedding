import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { propertyCreatedByName } from "./propertyCreatedByName.ts";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isIsoDateOnly(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

/** Legacy funnel prefix — avoids duplicate CRM rows during hub cutover. */
export function buildLegacyWeddingFunnelKey(webId: string, identityHash: string): string {
  return `wedding-package-lead:${webId}:package:${identityHash.slice(0, 16)}`.slice(0, 200);
}

function buildFunnelKey(webId: string, formId: string, identityHash: string): string {
  if (webId === "vialdi-wedding" && formId === "contact-main") {
    return buildLegacyWeddingFunnelKey(webId, identityHash);
  }
  return `contact-submit:${webId}:${formId}:${identityHash.slice(0, 16)}`.slice(0, 200);
}

export async function syncCrmLeadStep1(args: {
  admin: SupabaseClient;
  systemUserId: string;
  organizationId: string;
  webId: string;
  formId: string;
  name: string;
  phone_number: string;
  email: string;
  package_label: string | null;
  analytics_session_id?: string | null;
  attribution: Record<string, unknown> | null;
  attribution_label: string | null;
  propertyDisplayName?: string | null;
}): Promise<{ ok: true; leadId: string; identityHash: string } | { ok: false; error: string }> {
  const identityHash = await sha256Hex(`${args.phone_number}|${args.email.toLowerCase()}`);
  const funnel_key = buildFunnelKey(args.webId, args.formId, identityHash);

  const title = args.package_label?.trim() || `Kontak — ${args.webId}`;
  const category =
    args.webId === "vialdi-wedding" && args.formId === "contact-main"
      ? "Wedding package card"
      : "Contact Form";

  const { data: lead, error: leadErr } = await args.admin
    .from("leads")
    .upsert(
      {
        client: args.name,
        title,
        category,
        created_by: args.systemUserId,
        created_by_name: propertyCreatedByName(args.propertyDisplayName, args.webId),
        assignee: "",
        followup: 0,
        organization_id: args.organizationId,
        phone_number: args.phone_number,
        email: args.email,
        source:
          args.webId === "vialdi-wedding" && args.formId === "contact-main"
            ? "Wedding package card"
            : `Hub ${args.webId}`,
        services: args.package_label ?? "",
        web_id: args.webId,
        funnel_key,
        ...(args.analytics_session_id ? { analytics_session_id: args.analytics_session_id } : {}),
        ...(args.attribution ? { attribution: args.attribution } : {}),
        ...(args.attribution_label ? { attribution_label: args.attribution_label } : {}),
      },
      { onConflict: "organization_id,dedupe_key" },
    )
    .select("id")
    .single();

  if (leadErr || !lead?.id) {
    return { ok: false, error: leadErr?.message ?? "Failed to upsert lead" };
  }

  const leadId = String(lead.id);

  const { error: profileErr } = await args.admin.from("lead_client_profiles").insert({
    lead_id: leadId,
    name: args.name,
    organization_id: args.organizationId,
    created_by: args.systemUserId,
    contact_person: args.name,
    contact_email: args.email,
    contact_phone: args.phone_number,
    phone_number: args.phone_number,
    email: args.email,
  });

  if (profileErr) {
    const code = (profileErr as { code?: string })?.code;
    const dup = code === "23505" || /duplicate key|unique constraint/i.test(profileErr.message);
    if (!dup) return { ok: false, error: profileErr.message };
  }

  return { ok: true, leadId, identityHash };
}

/** Patch an existing CRM lead (e.g. from WA floating click) when form step 1 adds PII. */
export async function patchCrmLeadFromStep1(args: {
  admin: SupabaseClient;
  leadId: string;
  systemUserId: string;
  organizationId: string;
  webId: string;
  formId: string;
  name: string;
  phone_number: string;
  email: string;
  package_label: string | null;
  analytics_session_id?: string | null;
  attribution: Record<string, unknown> | null;
  attribution_label: string | null;
}): Promise<{ ok: true; identityHash: string } | { ok: false; error: string }> {
  const identityHash = await sha256Hex(`${args.phone_number}|${args.email.toLowerCase()}`);
  const funnel_key = buildFunnelKey(args.webId, args.formId, identityHash);

  const title = args.package_label?.trim() || `Kontak — ${args.webId}`;
  const category =
    args.webId === "vialdi-wedding" && args.formId === "contact-main"
      ? "Wedding package card"
      : "Contact Form";

  const patch: Record<string, unknown> = {
    client: args.name,
    title,
    category,
    phone_number: args.phone_number,
    email: args.email,
    funnel_key,
    source:
      args.webId === "vialdi-wedding" && args.formId === "contact-main"
        ? "Wedding package card"
        : `Hub ${args.webId}`,
    services: args.package_label ?? "",
    web_id: args.webId,
    updated_at: new Date().toISOString(),
    ...(args.analytics_session_id ? { analytics_session_id: args.analytics_session_id } : {}),
    ...(args.attribution ? { attribution: args.attribution } : {}),
    ...(args.attribution_label ? { attribution_label: args.attribution_label } : {}),
  };

  const { error: leadErr } = await args.admin
    .from("leads")
    .update(patch)
    .eq("id", args.leadId)
    .eq("organization_id", args.organizationId);

  if (leadErr) return { ok: false, error: leadErr.message };

  const { error: profileErr } = await args.admin.from("lead_client_profiles").insert({
    lead_id: args.leadId,
    name: args.name,
    organization_id: args.organizationId,
    created_by: args.systemUserId,
    contact_person: args.name,
    contact_email: args.email,
    contact_phone: args.phone_number,
    phone_number: args.phone_number,
    email: args.email,
  });

  if (profileErr) {
    const code = (profileErr as { code?: string })?.code;
    const dup = code === "23505" || /duplicate key|unique constraint/i.test(profileErr.message);
    if (dup) {
      const { error: upErr } = await args.admin
        .from("lead_client_profiles")
        .update({
          name: args.name,
          contact_person: args.name,
          contact_email: args.email,
          contact_phone: args.phone_number,
          phone_number: args.phone_number,
          email: args.email,
        })
        .eq("lead_id", args.leadId);
      if (upErr) return { ok: false, error: upErr.message };
    } else {
      return { ok: false, error: profileErr.message };
    }
  }

  return { ok: true, identityHash };
}

export async function updateCrmLeadFromSubmission(args: {
  admin: SupabaseClient;
  leadId: string;
  organizationId: string;
  webId: string;
  formId: string;
  mergedFormData: Record<string, unknown>;
  package_label: string | null;
  attribution: Record<string, unknown> | null;
  attribution_label: string | null;
  analytics_session_id?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (args.attribution) patch.attribution = args.attribution;
  if (args.attribution_label) patch.attribution_label = args.attribution_label;
  if (args.analytics_session_id) patch.analytics_session_id = args.analytics_session_id;

  const isWedding = args.webId === "vialdi-wedding" && args.formId === "contact-main";
  const pkg = (args.package_label ?? "").trim();
  const eventDate =
    typeof args.mergedFormData.event_date === "string" && isIsoDateOnly(args.mergedFormData.event_date)
      ? args.mergedFormData.event_date.trim()
      : "";
  const eventTime = String(args.mergedFormData.event_time ?? "").trim();
  const eventAddress = String(args.mergedFormData.event_address ?? "").trim();

  if (isWedding) {
    patch.services = `${pkg} — tanggal ${eventDate}, jam ${eventTime}`;
  } else if (args.package_label) {
    patch.services = args.package_label;
  }

  const { error } = await args.admin
    .from("leads")
    .update(patch)
    .eq("id", args.leadId)
    .eq("organization_id", args.organizationId);

  if (error) return { ok: false, error: error.message };

  if (isWedding) {
    const notesBlock =
      `Paket: ${pkg}\n` +
      `Tanggal acara: ${eventDate}\n` +
      `Jam acara: ${eventTime}\n` +
      `Alamat lengkap:\n${eventAddress}`;
    const { error: profileErr } = await args.admin
      .from("lead_client_profiles")
      .update({
        occupation: `Acara: ${eventDate} (${eventTime})`,
        notes: notesBlock,
      })
      .eq("lead_id", args.leadId);
    if (profileErr) {
      console.warn("updateCrmLeadFromSubmission: lead_client_profiles update failed", profileErr.message);
    }
  }

  return { ok: true };
}
