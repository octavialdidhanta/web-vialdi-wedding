// Supabase Edge Function: contact-lead
// Handles 3-step lead capture and sync to `leads` + `lead_client_profiles`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type Step = 1 | 2 | 3;

type Payload =
  | { step: 1; name: string; phone_number: string; email: string }
  | { step: 2; id: string; industry: string; business_type: "B2B" | "B2C" }
  | {
      step: 3;
      id: string;
      job_title: string;
      needs: string;
      office_address: string;
    };

const ORG_ID = "663c9336-8cb6-4a36-9ad9-313126e70a1a";
const TITLE = "Lead Website - Vialdi.ID";
const CATEGORY = "Contact Form";
const CREATED_BY_NAME = "Web Vialdi.ID";
const ASSIGNEE = "Unassigned";

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      ...(init.headers ?? {}),
    },
  });
}

function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

function mustGetEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizePhone(v: string) {
  const trimmed = v.trim();
  // Remove common separators/spaces
  const compact = trimmed.replace(/[\s().-]/g, "");

  // Already E.164
  if (compact.startsWith("+")) {
    const digits = compact.slice(1).replace(/[^\d]/g, "");
    return `+${digits}`;
  }

  // Indonesia local format: 08xxxxxxxxxx / 8xxxxxxxxxx -> +628xxxxxxxxxx
  const digitsOnly = compact.replace(/[^\d]/g, "");
  if (/^(0?8\d{8,13})$/.test(digitsOnly)) {
    const national = digitsOnly.startsWith("0") ? digitsOnly.slice(1) : digitsOnly; // 8xxxxxxxxxx
    return `+62${national}`; // +628xxxxxxxxxx
  }

  // Fallback: digits only with optional leading +
  const digits = compact.replace(/[^\d]/g, "");
  return digits.length ? `+${digits}` : "";
}

function isPhone(v: string) {
  const normalized = normalizePhone(v);
  const digits = normalized.replace(/[^\d]/g, "");
  return normalized.startsWith("+") && digits.length >= 9 && digits.length <= 15;
}

type WhatsappSendResult =
  | { ok: true; skipped?: boolean; message_id?: string; response_text?: string }
  | { ok: false; skipped?: boolean; error: string };

function getEnvOptional(name: string) {
  const v = Deno.env.get(name);
  return v && v.trim().length ? v.trim() : null;
}

function parseTemplateBodyKeys(): string[] {
  const raw = getEnvOptional("WHATSAPP_TEMPLATE_BODY_KEYS");
  if (!raw) {
    const name = (getEnvOptional("WHATSAPP_TEMPLATE_NAME") ?? "hello_world").trim().toLowerCase();
    if (name === "hello_world") return [];
    return ["name"];
  }
  if (/^__none__$/i.test(raw.trim())) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Sejajar urutan dengan `WHATSAPP_TEMPLATE_BODY_KEYS` untuk template body bernama (Meta). */
function parseTemplateBodyParameterNames(expectedCount: number): string[] | null {
  const raw = getEnvOptional("WHATSAPP_TEMPLATE_BODY_PARAMETER_NAMES");
  if (!raw) return null;
  const names = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (names.length !== expectedCount) {
    console.warn(
      `contact-lead: WHATSAPP_TEMPLATE_BODY_PARAMETER_NAMES count (${names.length}) != KEYS (${expectedCount}) — pakai format posisional`,
    );
    return null;
  }
  return names;
}

function getLeadField(ctx: Record<string, string>, key: string) {
  const v = ctx[key];
  return typeof v === "string" ? v : "";
}

/** Meta Cloud API expects `to` as international digits without leading +. */
function waToDigitsForGraphApi(e164: string) {
  return e164.replace(/^\+/, "").replace(/[^\d]/g, "");
}

function extractWaMessageIdFromGraphResponse(parsed: unknown): string | undefined {
  if (!parsed || typeof parsed !== "object") return undefined;
  const root = parsed as Record<string, unknown>;
  const messages = root.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    const first = messages[0];
    if (first && typeof first === "object") {
      const id = (first as Record<string, unknown>).id;
      if (typeof id === "string" && id.trim()) return id.trim();
    }
  }
  const message = root.message;
  if (message && typeof message === "object") {
    const id = (message as Record<string, unknown>).id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return undefined;
}

/** Fallback when JSON shape differs but body still contains a Graph wamid. */
function extractWaMessageIdFromRawText(text: string): string | undefined {
  const quoted = text.match(/"id"\s*:\s*"(wamid\.[^"]+)"/);
  if (quoted?.[1]) return quoted[1];
  const loose = text.match(/(wamid\.[A-Za-z0-9+/=_-]{12,})/);
  if (loose?.[1]) return loose[1];
  return undefined;
}

/** Readable preview for inbox / `whatsapp_messages.body` (template + variable lines). */
function formatTemplateMessageBody(args: {
  templateName: string;
  keys: string[];
  ctx: Record<string, string>;
}) {
  const lines = args.keys
    .map((k) => {
      const v = getLeadField(args.ctx, k).trim();
      return v ? `${k}: ${v}` : "";
    })
    .filter(Boolean);
  const header = `[Template: ${args.templateName}]`;
  const body = lines.length ? `${header}\n${lines.join("\n")}` : header;
  return body.slice(0, 8000);
}

async function sendWhatsappTemplateToClient(args: {
  toE164: string;
  ctx: Record<string, string>;
}): Promise<WhatsappSendResult> {
  const token = getEnvOptional("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = getEnvOptional("WHATSAPP_PHONE_NUMBER_ID");
  const templateName = getEnvOptional("WHATSAPP_TEMPLATE_NAME") ?? "hello_world";
  const templateLanguage = getEnvOptional("WHATSAPP_TEMPLATE_LANGUAGE") ?? "en_US";
  const graphVersion = getEnvOptional("WHATSAPP_GRAPH_VERSION") ?? "v21.0";

  if (!token || !phoneNumberId) {
    return { ok: true, skipped: true };
  }

  const toDigits = waToDigitsForGraphApi(args.toE164);
  if (!toDigits) {
    return { ok: false, error: "Invalid phone for WhatsApp (empty after normalization)" };
  }

  const keys = parseTemplateBodyKeys();
  const paramNames = parseTemplateBodyParameterNames(keys.length);
  const parameters = keys.map((k, i) => {
    const t = getLeadField(args.ctx, k).trim().slice(0, 1024);
    const text = t.length > 0 ? t : "\u2014";
    const p: Record<string, unknown> = { type: "text", text };
    if (paramNames?.[i]) {
      p.parameter_name = paramNames[i];
    }
    return p;
  });

  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
  const template: Record<string, unknown> = {
    name: templateName,
    language: { code: templateLanguage },
  };
  if (parameters.length > 0) {
    template.components = [{ type: "body", parameters }];
  }

  const body = {
    messaging_product: "whatsapp",
    to: toDigits,
    type: "template",
    template,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    const usesNamed = Boolean(paramNames && paramNames.length === parameters.length);
    console.error("contact-lead: WhatsApp Graph request failed", {
      status: res.status,
      template: templateName,
      language: templateLanguage,
      body_key_count: keys.length,
      body_uses_parameter_name: usesNamed,
      graph_error_preview: text.slice(0, 400),
    });
    return { ok: false, error: `WhatsApp API error (${res.status}): ${text.slice(0, 500)}` };
  }

  const responseSnippet = text.slice(0, 8000);
  try {
    const parsed: unknown = JSON.parse(text);
    let messageId = extractWaMessageIdFromGraphResponse(parsed);
    if (!messageId) messageId = extractWaMessageIdFromRawText(text);
    return { ok: true, message_id: messageId, response_text: responseSnippet };
  } catch {
    const messageId = extractWaMessageIdFromRawText(text);
    return { ok: true, message_id: messageId, response_text: responseSnippet };
  }
}

type AdminClient = ReturnType<typeof createClient>;

type WhatsappDbOkForSync = { conversation_id: string; message_id: string | null };
type WhatsappDbResultForSync = WhatsappDbOkForSync | { error: string };

/** Same ticket string as `public.whatsapp_conversations.ticket_id` (generated) and Leads "Open Chat". */
function waTicketIdFromConversationUuid(convId: string): string {
  return "WA-" + String(convId).replace(/-/g, "").slice(0, 8).toUpperCase();
}

/**
 * Sets `leads.ticket_id` to match the WA conversation ticket and removes other leads with that ticket
 * (e.g. duplicates from whatsapp-webhook). Inlined here so deploy bundles a single `index.ts` entry.
 */
async function syncLeadTicketAfterOutboundConversation(
  admin: AdminClient,
  organizationId: string,
  leadId: string,
  whatsappDb: WhatsappDbResultForSync | null,
  customerWaDigits?: string | null,
): Promise<{ ok: boolean; ticket_id?: string; error?: string }> {
  if (whatsappDb === null || "error" in whatsappDb) return { ok: false, error: "skip" };
  const convId = whatsappDb.conversation_id;
  if (!convId) return { ok: false, error: "no conversation_id" };

  const waTicket = waTicketIdFromConversationUuid(convId);
  const now = new Date().toISOString();

  const { error: delErr } = await admin
    .from("leads")
    .delete()
    .eq("organization_id", organizationId)
    .eq("ticket_id", waTicket)
    .neq("id", leadId);

  if (delErr) {
    console.error("syncLeadTicketAfterOutboundConversation: delete duplicate leads failed", delErr);
    return { ok: false, error: delErr.message };
  }

  const patch: Record<string, unknown> = { ticket_id: waTicket, updated_at: now };
  const digits = String(customerWaDigits ?? "").replace(/\D/g, "").trim();
  if (digits.length >= 9) patch.phone_number = digits;

  const { error: upErr } = await admin
    .from("leads")
    .update(patch)
    .eq("id", leadId)
    .eq("organization_id", organizationId);

  if (upErr) {
    console.error("syncLeadTicketAfterOutboundConversation: update lead failed", upErr);
    return { ok: false, error: upErr.message };
  }

  return { ok: true, ticket_id: waTicket };
}

/** Digits-only WhatsApp identity (no leading +). */
function customerWaIdFromE164(e164: string) {
  return e164.replace(/^\+/, "").replace(/[^\d]/g, "");
}

/**
 * After a successful outbound template send: ensure conversation (select → update | insert;
 * avoids PostgREST `.upsert(onConflict)` which often fails against partial unique indexes),
 * then insert one outbound row in whatsapp_messages for every successful template send:
 * idempotent by `wa_message_id` when present, else by `raw_metadata.idempotency_key`.
 */
async function upsertConversationAndInsertOutboundMessage(args: {
  admin: AdminClient;
  organizationId: string;
  customerE164: string;
  customerName: string;
  phoneNumberId: string;
  waMessageId: string;
  messageBody: string;
  idempotencyKey: string;
  lastMessageBody: string;
  rawMetadata: Record<string, unknown>;
}): Promise<
  { conversation_id: string; message_id: string | null } | { error: string }
> {
  const customerWaId = customerWaIdFromE164(args.customerE164);
  if (!customerWaId) {
    return { error: "Invalid customer phone for WhatsApp logging" };
  }

  const now = new Date().toISOString();

  const { data: existingRows, error: selErr } = await args.admin
    .from("whatsapp_conversations")
    .select("id")
    .eq("organization_id", args.organizationId)
    .eq("customer_wa_id", customerWaId)
    .eq("phone_number_id", args.phoneNumberId)
    .eq("channel", "whatsapp")
    .limit(1);

  if (selErr) return { error: selErr.message };

  let conversationId = existingRows?.[0]?.id as string | undefined;

  if (conversationId) {
    const { error: upErr } = await args.admin
      .from("whatsapp_conversations")
      .update({
        customer_name: args.customerName,
        last_message_at: now,
        last_message_body: args.lastMessageBody,
        updated_at: now,
      })
      .eq("id", conversationId);
    if (upErr) return { error: upErr.message };
  } else {
    const { data: inserted, error: insErr } = await args.admin
      .from("whatsapp_conversations")
      .insert({
        organization_id: args.organizationId,
        customer_wa_id: customerWaId,
        channel: "whatsapp",
        phone_number_id: args.phoneNumberId,
        customer_name: args.customerName,
        last_message_at: now,
        last_message_body: args.lastMessageBody,
        updated_at: now,
      })
      .select("id")
      .single();

    if (insErr) {
      const dup =
        (insErr as { code?: string }).code === "23505" ||
        /duplicate key|unique constraint/i.test(insErr.message);
      if (dup) {
        const { data: racedRows, error: racedErr } = await args.admin
          .from("whatsapp_conversations")
          .select("id")
          .eq("organization_id", args.organizationId)
          .eq("customer_wa_id", customerWaId)
          .eq("phone_number_id", args.phoneNumberId)
          .eq("channel", "whatsapp")
          .limit(1);
        if (racedErr) return { error: racedErr.message };
        conversationId = racedRows?.[0]?.id as string | undefined;
      } else {
        return { error: insErr.message };
      }
    } else {
      conversationId = inserted?.id as string | undefined;
    }
  }

  if (!conversationId) return { error: "Conversation ensure returned no id" };

  const meta = { ...args.rawMetadata, idempotency_key: args.idempotencyKey };
  const waMid = args.waMessageId.trim();
  const bodyText = args.messageBody.trim() || args.lastMessageBody;

  if (waMid) {
    const { data: existingMsg, error: existingErr } = await args.admin
      .from("whatsapp_messages")
      .select("id")
      .eq("wa_message_id", waMid)
      .maybeSingle();

    if (existingErr) return { error: existingErr.message };
    if (existingMsg?.id) {
      return { conversation_id: conversationId, message_id: existingMsg.id as string };
    }
  } else {
    const { data: existingByKey, error: keyErr } = await args.admin
      .from("whatsapp_messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .contains("raw_metadata", { idempotency_key: args.idempotencyKey })
      .limit(1)
      .maybeSingle();

    if (keyErr) return { error: keyErr.message };
    if (existingByKey?.id) {
      return { conversation_id: conversationId, message_id: existingByKey.id as string };
    }
  }

  const { data: msg, error: msgErr } = await args.admin
    .from("whatsapp_messages")
    .insert({
      conversation_id: conversationId,
      direction: "outbound",
      wa_message_id: waMid || null,
      platform_message_id: waMid || null,
      message_type: "template",
      body: bodyText,
      raw_metadata: meta,
      status: "accepted",
      status_updated_at: now,
      channel: "whatsapp",
    })
    .select("id")
    .single();

  if (msgErr) {
    const dup =
      (msgErr as { code?: string }).code === "23505" ||
      /duplicate key|unique constraint/i.test(msgErr.message);
    if (dup && waMid) {
      const { data: raced, error: racedErr } = await args.admin
        .from("whatsapp_messages")
        .select("id")
        .eq("wa_message_id", waMid)
        .maybeSingle();
      if (!racedErr && raced?.id) {
        return { conversation_id: conversationId, message_id: raced.id as string };
      }
    }
    if (dup && !waMid) {
      const { data: racedKey, error: racedKeyErr } = await args.admin
        .from("whatsapp_messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .contains("raw_metadata", { idempotency_key: args.idempotencyKey })
        .limit(1)
        .maybeSingle();
      if (!racedKeyErr && racedKey?.id) {
        return { conversation_id: conversationId, message_id: racedKey.id as string };
      }
    }
    return { error: msgErr.message };
  }
  const messageId = msg?.id as string;
  if (!messageId) return { error: "Message insert returned no id" };

  return { conversation_id: conversationId, message_id: messageId };
}

function asStep(n: unknown): Step | null {
  if (n === 1 || n === 2 || n === 3) return n;
  return null;
}

function nonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function okPayload(body: any): Payload | null {
  const step = asStep(body?.step);
  if (!step) return null;

  if (step === 1) {
    if (!nonEmpty(body?.name)) return null;
    if (!nonEmpty(body?.phone_number) || !isPhone(body.phone_number)) return null;
    if (!nonEmpty(body?.email) || !isEmail(body.email)) return null;
    return {
      step: 1,
      name: body.name.trim(),
      phone_number: normalizePhone(body.phone_number),
      email: body.email.trim(),
    };
  }

  if (step === 2) {
    if (!nonEmpty(body?.id)) return null;
    if (!nonEmpty(body?.industry)) return null;
    if (body?.business_type !== "B2B" && body?.business_type !== "B2C") return null;
    return {
      step: 2,
      id: body.id.trim(),
      industry: body.industry.trim(),
      business_type: body.business_type,
    };
  }

  if (step === 3) {
    if (!nonEmpty(body?.id)) return null;
    if (!nonEmpty(body?.job_title)) return null;
    if (!nonEmpty(body?.needs)) return null;
    if (!nonEmpty(body?.office_address)) return null;
    return {
      step: 3,
      id: body.id.trim(),
      job_title: body.job_title.trim(),
      needs: body.needs.trim(),
      office_address: body.office_address.trim(),
    };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });

  let payloadRaw: unknown;
  try {
    payloadRaw = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const payload = okPayload(payloadRaw);
  if (!payload) return badRequest("Invalid payload for step");

  let supabaseUrl: string;
  let serviceRoleKey: string;
  let systemUserId: string;
  try {
    supabaseUrl = mustGetEnv("SUPABASE_URL");
    serviceRoleKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
    systemUserId = mustGetEnv("SYSTEM_USER_ID");
  } catch (e) {
    return json({ error: (e as Error).message }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Step 1: insert leads_vialdiid + create leads + lead_client_profiles
  if (payload.step === 1) {
    const { data: vialdiLead, error: vialdiErr } = await admin
      .from("leads_vialdiid")
      .insert({
        organization_id: ORG_ID,
        name: payload.name,
        phone_number: payload.phone_number,
        email: payload.email,
        step: 1,
        source: "Website",
      })
      .select("*")
      .single();

    if (vialdiErr) return json({ error: vialdiErr.message }, { status: 500 });

    const { data: lead, error: leadErr } = await admin
      .from("leads")
      .insert({
        client: payload.name,
        title: TITLE,
        category: CATEGORY,
        created_by: systemUserId,
        created_by_name: CREATED_BY_NAME,
        assignee: ASSIGNEE,
        organization_id: ORG_ID,
        phone_number: payload.phone_number,
        email: payload.email,
        source: "Website",
      })
      .select("id")
      .single();

    if (leadErr) return json({ error: leadErr.message }, { status: 500 });

    const leadId = lead.id as string;

    const { error: profileErr } = await admin.from("lead_client_profiles").insert({
      lead_id: leadId,
      name: payload.name,
      organization_id: ORG_ID,
      created_by: systemUserId,
      contact_person: payload.name,
      contact_email: payload.email,
      contact_phone: payload.phone_number,
      phone_number: payload.phone_number,
      email: payload.email,
    });

    if (profileErr) return json({ error: profileErr.message }, { status: 500 });

    const { error: linkErr } = await admin
      .from("leads_vialdiid")
      .update({ lead_id: leadId })
      .eq("id", vialdiLead.id);

    if (linkErr) return json({ error: linkErr.message }, { status: 500 });

    return json({ id: vialdiLead.id, lead_id: leadId });
  }

  // Step 2/3: update leads_vialdiid then sync to leads + lead_client_profiles
  const { data: existing, error: existingErr } = await admin
    .from("leads_vialdiid")
    .select("*")
    .eq("id", payload.id)
    .single();

  if (existingErr) return json({ error: existingErr.message }, { status: 500 });
  if (!existing) return badRequest("Lead not found");

  const leadId = existing.lead_id as string | null;
  if (!leadId) return json({ error: "Lead mapping missing (lead_id is null)" }, { status: 500 });

  if (payload.step === 2) {
    const { error: upErr } = await admin
      .from("leads_vialdiid")
      .update({ industry: payload.industry, business_type: payload.business_type, step: 2 })
      .eq("id", payload.id);
    if (upErr) return json({ error: upErr.message }, { status: 500 });

    const { error: profileUpErr } = await admin
      .from("lead_client_profiles")
      .update({ industry: payload.industry })
      .eq("lead_id", leadId);
    if (profileUpErr) return json({ error: profileUpErr.message }, { status: 500 });

    return json({ id: payload.id, lead_id: leadId });
  }

  // step === 3
  const { error: upErr } = await admin
    .from("leads_vialdiid")
    .update({
      job_title: payload.job_title,
      needs: payload.needs,
      office_address: payload.office_address,
      step: 3,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", payload.id);
  if (upErr) return json({ error: upErr.message }, { status: 500 });

  // Put most relevant fields into lead & profile
  const services = payload.needs;
  const { error: leadUpErr } = await admin.from("leads").update({ services }).eq("id", leadId);
  if (leadUpErr) return json({ error: leadUpErr.message }, { status: 500 });

  const { error: profileUpErr } = await admin
    .from("lead_client_profiles")
    .update({
      occupation: payload.job_title,
      notes: payload.office_address,
    })
    .eq("lead_id", leadId);
  if (profileUpErr) return json({ error: profileUpErr.message }, { status: 500 });

  const { data: finalRow, error: finalErr } = await admin
    .from("leads_vialdiid")
    .select("*")
    .eq("id", payload.id)
    .single();
  if (finalErr) return json({ error: finalErr.message }, { status: 500 });

  const to = normalizePhone(String(finalRow?.phone_number ?? ""));
  const ctx: Record<string, string> = {
    name: String(finalRow?.name ?? ""),
    email: String(finalRow?.email ?? ""),
    phone_number: String(finalRow?.phone_number ?? ""),
    industry: String(finalRow?.industry ?? ""),
    business_type: String(finalRow?.business_type ?? ""),
    job_title: String(finalRow?.job_title ?? ""),
    needs: String(finalRow?.needs ?? ""),
    office_address: String(finalRow?.office_address ?? ""),
    lead_id: String(leadId),
    lead_vialdiid_id: String(payload.id),
  };

  const wa = await sendWhatsappTemplateToClient({ toE164: to, ctx });

  const templateName = getEnvOptional("WHATSAPP_TEMPLATE_NAME") ?? "hello_world";
  const templateLanguage = getEnvOptional("WHATSAPP_TEMPLATE_LANGUAGE") ?? "en_US";
  const phoneNumberId = getEnvOptional("WHATSAPP_PHONE_NUMBER_ID");

  let whatsapp_db:
    | { conversation_id: string; message_id: string | null }
    | { error: string }
    | null = null;

  if (wa.ok && !wa.skipped && phoneNumberId) {
    const keys = parseTemplateBodyKeys();
    const messagePreview = formatTemplateMessageBody({
      templateName,
      keys,
      ctx,
    });
    const lastMessageBody = messagePreview.slice(0, 1024);

    const responseText = wa.ok && "response_text" in wa ? (wa.response_text ?? "") : "";
    const effectiveWamid = (
      (typeof wa.message_id === "string" && wa.message_id.trim()) ||
      extractWaMessageIdFromRawText(responseText) ||
      ""
    ).trim();

    const rawMetadata: Record<string, unknown> = {
      source: "contact-lead",
      template: { name: templateName, language: templateLanguage },
      template_body_keys: keys,
      lead_id: leadId,
      leads_vialdiid_id: payload.id,
      customer_e164: to,
      graph_wamid: effectiveWamid || null,
      parameters: Object.fromEntries(keys.map((k) => [k, getLeadField(ctx, k)])),
      graph_response_snippet: responseText.slice(0, 2000),
    };

    whatsapp_db = await upsertConversationAndInsertOutboundMessage({
      admin,
      organizationId: ORG_ID,
      customerE164: to,
      customerName: String(finalRow?.name ?? ""),
      phoneNumberId,
      waMessageId: effectiveWamid,
      messageBody: messagePreview,
      idempotencyKey: `contact-lead:step3:${payload.id}`,
      lastMessageBody,
      rawMetadata,
    });
  }

  let lead_ticket_sync: { ok: boolean; ticket_id?: string; error?: string } | null = null;
  if (whatsapp_db && !("error" in whatsapp_db)) {
    lead_ticket_sync = await syncLeadTicketAfterOutboundConversation(
      admin,
      ORG_ID,
      leadId,
      whatsapp_db,
      customerWaIdFromE164(to),
    );
  }

  return json({
    id: payload.id,
    lead_id: leadId,
    whatsapp: wa.ok
      ? { sent: !wa.skipped, skipped: Boolean(wa.skipped), message_id: wa.message_id ?? null }
      : { sent: false, error: wa.error },
    ...(whatsapp_db !== null ? { whatsapp_db } : {}),
    ...(lead_ticket_sync !== null ? { lead_ticket_sync } : {}),
  });
});

