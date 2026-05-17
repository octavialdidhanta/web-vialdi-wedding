import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
}): Promise<{ ok: true; leadId: string; identityHash: string } | { ok: false; error: string }> {
  const identityHash = await sha256Hex(`${args.phone_number}|${args.email.toLowerCase()}`);
  const funnel_key = `contact-submit:${args.webId}:${args.formId}:${identityHash.slice(0, 16)}`.slice(
    0,
    200,
  );

  const title = args.package_label?.trim() || `Kontak — ${args.webId}`;
  const category = "Contact Form";

  const { data: lead, error: leadErr } = await args.admin
    .from("leads")
    .upsert(
      {
        client: args.name,
        title,
        category,
        created_by: args.systemUserId,
        created_by_name: "Website",
        organization_id: args.organizationId,
        phone_number: args.phone_number,
        email: args.email,
        source: `Hub ${args.webId}`,
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

export async function updateCrmLeadFromSubmission(args: {
  admin: SupabaseClient;
  leadId: string;
  organizationId: string;
  mergedFormData: Record<string, unknown>;
  package_label: string | null;
  attribution: Record<string, unknown> | null;
  attribution_label: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (args.package_label) patch.services = args.package_label;
  if (args.attribution) patch.attribution = args.attribution;
  if (args.attribution_label) patch.attribution_label = args.attribution_label;

  const { error } = await args.admin
    .from("leads")
    .update(patch)
    .eq("id", args.leadId)
    .eq("organization_id", args.organizationId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
