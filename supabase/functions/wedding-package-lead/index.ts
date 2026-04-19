// Supabase Edge Function: wedding-package-lead
// 2-step lead capture from wedding package cards → `leads_vialdi_wedding` + sync `leads` + `lead_client_profiles`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type WeddingStep = 1 | 2;

type Payload =
  | {
      step: 1;
      name: string;
      phone_number: string;
      email: string;
      package_label: string;
      /** Jika ada: perbarui baris step 1 yang sama (autosave), jangan buat lead ganda. */
      id?: string;
    }
  | {
      step: 2;
      id: string;
      event_date: string;
      event_time: string;
      event_address: string;
    };

const ORG_ID = "663c9336-8cb6-4a36-9ad9-313126e70a1a";
const TITLE = "Lead Website";
const CATEGORY = "Wedding package card";
const SOURCE = "Website";
const CREATED_BY_NAME = "Vialdi Wedding";
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
  | { ok: true; skipped?: boolean; skip_reason?: string; message_id?: string; response_text?: string }
  | { ok: false; skipped?: boolean; error: string; skip_reason?: string };

function getEnvOptional(name: string) {
  const v = Deno.env.get(name);
  return v && v.trim().length ? v.trim() : null;
}

function parseTemplateBodyKeys(): string[] {
  const raw = getEnvOptional("WHATSAPP_TEMPLATE_BODY_KEYS");
  if (!raw) return ["name"];
  const keys = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Kosong (mis. env rusak) → minimal satu parameter agar Graph tidak error
  return keys.length > 0 ? keys : ["name"];
}

/** Meta (#131008) menolak parameter body berteks kosong — wajib ada nilai. */
function nonEmptyTemplateParamText(value: string): string {
  const t = value.trim().slice(0, 1024);
  return t.length > 0 ? t : "\u2014";
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
    const skip_reason = !token && !phoneNumberId
      ? "missing_WHATSAPP_ACCESS_TOKEN_and_WHATSAPP_PHONE_NUMBER_ID"
      : !token
        ? "missing_WHATSAPP_ACCESS_TOKEN"
        : "missing_WHATSAPP_PHONE_NUMBER_ID";
    console.warn(`wedding-package-lead: WhatsApp API not called — ${skip_reason}`);
    return { ok: true, skipped: true, skip_reason };
  }

  const toDigits = waToDigitsForGraphApi(args.toE164);
  if (!toDigits) {
    return { ok: false, error: "Invalid phone for WhatsApp (empty after normalization)" };
  }

  const keys = parseTemplateBodyKeys();
  const parameters = keys.map((k) => ({
    type: "text",
    text: nonEmptyTemplateParamText(getLeadField(args.ctx, k)),
  }));

  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to: toDigits,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLanguage },
      components:
        parameters.length > 0
          ? [
              {
                type: "body",
                parameters,
              },
            ]
          : [],
    },
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

function asWeddingStep(n: unknown): WeddingStep | null {
  if (n === 1 || n === 2) return n;
  return null;
}

function isIsoDateOnly(v: string) {
  const s = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(`${s}T12:00:00.000Z`);
  return !Number.isNaN(t);
}

function nonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());
}

function okPayload(body: any): Payload | null {
  const step = asWeddingStep(body?.step);
  if (!step) return null;

  if (step === 1) {
    if (!nonEmpty(body?.name)) return null;
    if (!nonEmpty(body?.phone_number) || !isPhone(body.phone_number)) return null;
    if (!nonEmpty(body?.email) || !isEmail(body.email)) return null;
    if (!nonEmpty(body?.package_label)) return null;
    const idRaw = body?.id;
    const id =
      typeof idRaw === "string" && idRaw.trim().length > 0 && isUuid(idRaw.trim()) ? idRaw.trim() : undefined;
    return {
      step: 1,
      name: body.name.trim(),
      phone_number: normalizePhone(body.phone_number),
      email: body.email.trim(),
      package_label: body.package_label.trim().slice(0, 500),
      ...(id ? { id } : {}),
    };
  }

  if (step === 2) {
    if (!nonEmpty(body?.id)) return null;
    if (!nonEmpty(body?.event_date) || !isIsoDateOnly(body.event_date)) return null;
    if (!nonEmpty(body?.event_time)) return null;
    if (!nonEmpty(body?.event_address)) return null;
    return {
      step: 2,
      id: body.id.trim(),
      event_date: body.event_date.trim(),
      event_time: body.event_time.trim().slice(0, 200),
      event_address: body.event_address.trim().slice(0, 8000),
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

  // Step 1: insert — atau perbarui baris + leads + profile jika `id` (autosave ulang)
  if (payload.step === 1) {
    if ("id" in payload && payload.id) {
      const p1 = payload;
      const { data: row, error: rowErr } = await admin
        .from("leads_vialdi_wedding")
        .select("*")
        .eq("id", p1.id)
        .single();

      if (rowErr || !row) return badRequest("Lead tidak ditemukan");
      if (Number(row.step) !== 1) return badRequest("Lead sudah tidak bisa diubah dari form ini");
      if (String(row.organization_id) !== ORG_ID) return badRequest("Lead tidak valid");

      const leadId = row.lead_id as string | null;
      if (!leadId) return json({ error: "Lead mapping missing (lead_id is null)" }, { status: 500 });

      const { error: wUp } = await admin
        .from("leads_vialdi_wedding")
        .update({
          name: p1.name,
          phone_number: p1.phone_number,
          email: p1.email,
          package_label: p1.package_label,
        })
        .eq("id", p1.id);
      if (wUp) return json({ error: wUp.message }, { status: 500 });

      const { error: lUp } = await admin
        .from("leads")
        .update({
          client: p1.name,
          phone_number: p1.phone_number,
          email: p1.email,
          services: p1.package_label,
        })
        .eq("id", leadId);
      if (lUp) return json({ error: lUp.message }, { status: 500 });

      const { error: pUp } = await admin
        .from("lead_client_profiles")
        .update({
          name: p1.name,
          contact_person: p1.name,
          contact_email: p1.email,
          contact_phone: p1.phone_number,
          phone_number: p1.phone_number,
          email: p1.email,
        })
        .eq("lead_id", leadId);
      if (pUp) return json({ error: pUp.message }, { status: 500 });

      return json({ id: p1.id, lead_id: leadId });
    }

    const { data: weddingLead, error: weddingErr } = await admin
      .from("leads_vialdi_wedding")
      .insert({
        organization_id: ORG_ID,
        name: payload.name,
        phone_number: payload.phone_number,
        email: payload.email,
        package_label: payload.package_label,
        step: 1,
        source: SOURCE,
      })
      .select("*")
      .single();

    if (weddingErr) return json({ error: weddingErr.message }, { status: 500 });

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
        source: SOURCE,
        services: payload.package_label,
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
      .from("leads_vialdi_wedding")
      .update({ lead_id: leadId })
      .eq("id", weddingLead.id);

    if (linkErr) return json({ error: linkErr.message }, { status: 500 });

    return json({ id: weddingLead.id, lead_id: leadId });
  }

  // Step 2 (final): detail acara + WhatsApp / tiket (setara step 3 contact-lead)
  const p2 = payload;

  const { data: existing, error: existingErr } = await admin
    .from("leads_vialdi_wedding")
    .select("*")
    .eq("id", p2.id)
    .single();

  if (existingErr) return json({ error: existingErr.message }, { status: 500 });
  if (!existing) return badRequest("Lead not found");

  const leadId = existing.lead_id as string | null;
  if (!leadId) return json({ error: "Lead mapping missing (lead_id is null)" }, { status: 500 });

  const pkg = String(existing.package_label ?? "").trim();
  const servicesLine = `${pkg} — tanggal ${p2.event_date}, jam ${p2.event_time}`;
  const notesBlock =
    `Paket: ${pkg}\n` +
    `Tanggal acara: ${p2.event_date}\n` +
    `Jam acara: ${p2.event_time}\n` +
    `Alamat lengkap:\n${p2.event_address}`;

  const { error: upErr } = await admin
    .from("leads_vialdi_wedding")
    .update({
      event_date: p2.event_date,
      event_time: p2.event_time,
      event_address: p2.event_address,
      step: 2,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", p2.id);
  if (upErr) return json({ error: upErr.message }, { status: 500 });

  const { error: leadUpErr } = await admin.from("leads").update({ services: servicesLine }).eq("id", leadId);
  if (leadUpErr) return json({ error: leadUpErr.message }, { status: 500 });

  const { error: profileUpErr } = await admin
    .from("lead_client_profiles")
    .update({
      occupation: `Acara: ${p2.event_date} (${p2.event_time})`,
      notes: notesBlock,
    })
    .eq("lead_id", leadId);
  if (profileUpErr) return json({ error: profileUpErr.message }, { status: 500 });

  const { data: finalRow, error: finalErr } = await admin
    .from("leads_vialdi_wedding")
    .select("*")
    .eq("id", p2.id)
    .single();
  if (finalErr) return json({ error: finalErr.message }, { status: 500 });

  const to = normalizePhone(String(finalRow?.phone_number ?? ""));
  const pkgLabel = String(finalRow?.package_label ?? "").trim();
  const evDate = String(finalRow?.event_date ?? "").trim();
  const evTime = String(finalRow?.event_time ?? "").trim();
  const evAddr = String(finalRow?.event_address ?? "").trim();
  const jobLine = [evDate && `Tanggal ${evDate}`, evTime && `Jam ${evTime}`].filter(Boolean).join(" · ");

  // Samakan kunci dengan contact-lead agar WHATSAPP_TEMPLATE_BODY_KEYS (template Vialdi.ID) terisi semua
  const ctx: Record<string, string> = {
    name: String(finalRow?.name ?? ""),
    email: String(finalRow?.email ?? ""),
    phone_number: String(finalRow?.phone_number ?? ""),
    industry: pkgLabel || "Wedding",
    business_type: "B2C",
    job_title: jobLine || "Calon pengantin",
    needs: pkgLabel || "Konsultasi paket wedding",
    office_address: evAddr || "\u2014",
    lead_id: String(leadId),
    lead_vialdiid_id: String(p2.id),
    package_label: pkgLabel,
    event_date: evDate,
    event_time: evTime,
    event_address: evAddr,
    leads_vialdi_wedding_id: String(p2.id),
  };

  const wa = await sendWhatsappTemplateToClient({ toE164: to, ctx });
  if (wa.ok && wa.skipped && "skip_reason" in wa && wa.skip_reason) {
    console.warn(`wedding-package-lead: lead ${leadId} saved; WhatsApp skipped: ${wa.skip_reason}`);
  }
  if (!wa.ok) {
    console.error(`wedding-package-lead: WhatsApp API error for lead ${leadId}:`, wa.error);
  }

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
      source: "wedding-package-lead",
      template: { name: templateName, language: templateLanguage },
      template_body_keys: keys,
      lead_id: leadId,
      leads_vialdi_wedding_id: p2.id,
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
      idempotencyKey: `wedding-package-lead:step2:${p2.id}`,
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

  const whatsappPayload = wa.ok
    ? {
        sent: !wa.skipped,
        skipped: Boolean(wa.skipped),
        message_id: wa.message_id ?? null,
        ...(wa.skipped && "skip_reason" in wa && typeof wa.skip_reason === "string"
          ? { skip_reason: wa.skip_reason }
          : {}),
      }
    : { sent: false as const, error: wa.error };

  return json({
    id: p2.id,
    lead_id: leadId,
    whatsapp: whatsappPayload,
    ...(whatsapp_db !== null ? { whatsapp_db } : {}),
    ...(lead_ticket_sync !== null ? { lead_ticket_sync } : {}),
  });
});

