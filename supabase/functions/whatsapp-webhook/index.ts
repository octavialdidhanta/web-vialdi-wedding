import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveSessionGclid } from "../_shared/gclid.ts";

/** Declare Deno global for IDE when edge-runtime.d.ts is not resolved */
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: { get(key: string): string | undefined };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const META_GRAPH_BASE = "https://graph.facebook.com/v18.0";
/** Same bucket as outbound sends (ChatThread) – satu bucket untuk kirim & terima media */
const WHATSAPP_MEDIA_BUCKET = "whatsapp-media";

/** Frasa + kata satuan yang mengindikasikan permintaan kontak. On/off via env WHATSAPP_BLOCK_CONTACT_REQUESTS. */
const CONTACT_REQUEST_PHRASES: readonly string[] = [
  "nomor", "wa", "whatsapp", "hp", "telepon", "telpon", "tlp", "tlpn", "telephone", "email", "kontak", "contact",
  "nomor hp", "nomor telepon", "nomor wa", "nomor whatsapp", "no hp", "no telepon", "no wa", "no whatsapp",
  "number wa", "whatsapp number", "hp kamu", "telepon kamu", "wa kamu", "kirim nomor", "beri nomor", "bagi nomor",
  "share nomor", "kontak kamu", "kontak anda", "nomor kontak", "no kontak", "bisa wa", "bisa chat wa", "chat wa dong",
  "wa saja", "hubungi wa", "whatsapp saja", "dm wa", "invite wa", "add wa", "nomor untuk dihubungi",
  "nomor yang bisa dihubungi", "no yang bisa dihubungi",
  "email kamu", "email anda", "alamat email", "e-mail", "kirim email", "beri email", "bagi email", "share email",
  "kontak email", "email untuk konfirmasi", "email untuk dihubungi", "dm email", "send email", "your email", "email address",
  "cara menghubungi", "cara hubungi", "bagaimana menghubungi", "how to contact", "contact you", "hubungi kamu",
  "nomor atau email", "no atau email", "line kamu", "id line", "telegram", "ig kamu", "instagram kamu", "sosmed", "media sosial",
  "minta nomor wa", "minta nomor", "berapa nomor", "apa nomor", "bisa minta nomor", "boleh minta nomor", "bisa minta kontak", "boleh minta kontak",
  "bisa minta email", "boleh minta email", "bisa kasih nomor", "boleh kasih nomor", "bisa share nomor", "boleh share nomor",
  "what's your number", "what's your email", "whatsapp number", "phone number", "contact number",
  "can i get your number", "can i get your email", "give me your number", "give me your email",
  "send me your number", "send me your email", "share your number", "share your email",
  "drop your number", "drop your email", "dm your number", "dm your email",
];

function messageContainsContactRequest(text: string | null | undefined): boolean {
  if (text == null || text === "") return false;
  const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
  if (normalized.length === 0) return false;
  return CONTACT_REQUEST_PHRASES.some((phrase) => normalized.includes(phrase));
}

/** Meta outbound status webhook values (sent → delivered → read); failed is terminal. */
function metaDeliveryRank(status: string): number | null {
  const s = status.trim().toLowerCase();
  if (s === "read") return 4;
  if (s === "delivered") return 3;
  if (s === "sent") return 2;
  if (s === "failed") return -1;
  return null;
}

function shouldUpgradeMetaDelivery(current: string | null | undefined, incoming: string): boolean {
  const incRank = metaDeliveryRank(incoming.trim());
  if (incRank === null) return false;
  if (incRank === -1) return true;

  const cur = String(current ?? "").trim();
  if (cur.toLowerCase() === "failed") return false;

  const curRank = metaDeliveryRank(cur);
  if (curRank === null || curRank === -1) return true;
  return incRank >= curRank;
}

/** Digits-only WA identity — same idea as contact-lead `customerWaIdFromE164` for stable conversation dedupe. */
function waCustomerDigits(raw: string): string {
  return String(raw ?? "").replace(/[^\d]/g, "");
}

/** Default status for new `whatsapp_conversations` (Open preferred, else Unread). */
async function fetchDefaultConversationLeadStatusId(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
): Promise<string | null> {
  const orgOrGlobal = `organization_id.eq.${orgId},organization_id.is.null`;
  const { data: openStatus } = await supabase
    .from("lead_statuses")
    .select("id")
    .or(orgOrGlobal)
    .eq("name", "Open")
    .maybeSingle();
  if (openStatus?.id) return openStatus.id as string;
  const { data: unreadStatus } = await supabase
    .from("lead_statuses")
    .select("id")
    .or(orgOrGlobal)
    .eq("name", "Unread")
    .maybeSingle();
  return (unreadStatus?.id as string) ?? null;
}

/**
 * Find existing conversation for (org, channel, phone_number_id + customer).
 * Exact match on digits-only `customer_wa_id` first; then scan recent rows for digit-normalized equality
 * so outbound-created rows (contact-lead) still match inbound `msg.from` variants.
 */
async function findExistingWhatsappConversationId(
  supabase: ReturnType<typeof createClient>,
  args: { organizationId: string; phoneNumberId: string; customerDigits: string },
): Promise<string | null> {
  const { organizationId, phoneNumberId, customerDigits } = args;
  if (!customerDigits) return null;
  const { data: exact } = await supabase
    .from("whatsapp_conversations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("customer_wa_id", customerDigits)
    .eq("channel", "whatsapp")
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();
  if (exact?.id) return exact.id as string;

  const anyLine = await findExistingWhatsappConversationIdAnyLine(supabase, {
    organizationId,
    customerDigits,
    preferredPhoneNumberId: phoneNumberId,
  });
  if (anyLine) return anyLine;

  const { data: candidates, error } = await supabase
    .from("whatsapp_conversations")
    .select("id, customer_wa_id, lead_status_id, created_at")
    .eq("organization_id", organizationId)
    .eq("channel", "whatsapp")
    .eq("phone_number_id", phoneNumberId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error || !candidates?.length) return null;
  const matches = candidates.filter((r: { customer_wa_id?: unknown }) =>
    waCustomerDigits(String(r.customer_wa_id ?? "")) === customerDigits,
  );
  if (!matches.length) return null;
  matches.sort(
    (
      a: { lead_status_id?: unknown; created_at?: unknown },
      b: { lead_status_id?: unknown; created_at?: unknown },
    ) => {
    const aNull = a.lead_status_id == null ? 1 : 0;
    const bNull = b.lead_status_id == null ? 1 : 0;
    if (aNull !== bNull) return aNull - bNull;
    return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
  });
  return (matches[0]?.id as string) ?? null;
}

type WhatsappConvDedupeRow = {
  id: string;
  phone_number_id?: string | null;
  customer_wa_id?: string | null;
  last_message_at?: string | null;
  created_at?: string | null;
};

function waTicketIdFromConversationUuid(convId: string): string {
  return WA_TICKET_PREFIX + String(convId).replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Pilih satu `id` percakapan kanonik; utamakan baris dengan `phone_number_id` = inbound Meta. */
function pickCanonicalWhatsappConversationId(
  rows: WhatsappConvDedupeRow[],
  preferredPhoneNumberId: string,
): string {
  const pref = String(preferredPhoneNumberId ?? "").trim();
  const preferred = rows.filter((r) => String(r.phone_number_id ?? "").trim() === pref);
  const pool = preferred.length > 0 ? preferred : [...rows];
  pool.sort((a, b) => {
    const tb = String(b.last_message_at ?? "");
    const ta = String(a.last_message_at ?? "");
    if (tb !== ta) return tb.localeCompare(ta);
    return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
  });
  return pool[0]!.id;
}

/**
 * Gabungkan duplikat (org + channel + digit pelanggan sama): pindahkan pesan, rapikan tiket lead,
 * hapus baris percakapan cadangan. Idempotent untuk webhook berulang.
 */
async function consolidateDuplicateWhatsappConversations(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  keepConversationId: string,
  removeConversationIds: string[],
): Promise<void> {
  const keepId = String(keepConversationId).trim();
  const newTicket = waTicketIdFromConversationUuid(keepId);
  const now = new Date().toISOString();

  for (const raw of removeConversationIds) {
    const rid = String(raw ?? "").trim();
    if (!rid || rid === keepId) continue;
    const oldTicket = waTicketIdFromConversationUuid(rid);

    const { error: msgErr } = await supabase
      .from("whatsapp_messages")
      .update({ conversation_id: keepId })
      .eq("conversation_id", rid);
    if (msgErr) {
      console.warn("consolidateDuplicateWhatsappConversations: move messages failed", rid, msgErr.message);
    }

    const { error: cycErr } = await supabase.from("whatsapp_conversation_cycles").delete().eq("conversation_id", rid);
    if (cycErr) {
      console.warn("consolidateDuplicateWhatsappConversations: delete cycles failed", rid, cycErr.message);
    }

    const { data: newTicketLead } = await supabase
      .from("leads")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("ticket_id", newTicket)
      .maybeSingle();

    const { data: oldLeads } = await supabase
      .from("leads")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("ticket_id", oldTicket);

    for (const ol of oldLeads ?? []) {
      const oldLeadId = String((ol as { id?: unknown }).id ?? "").trim();
      if (!oldLeadId) continue;
      const keepLeadId = newTicketLead?.id != null ? String(newTicketLead.id).trim() : "";
      if (keepLeadId && keepLeadId !== oldLeadId) {
        await supabase.from("lead_submissions").update({ lead_id: keepLeadId }).eq("lead_id", oldLeadId);
        const { error: delLeadErr } = await supabase.from("leads").delete().eq("id", oldLeadId);
        if (delLeadErr) {
          console.warn("consolidateDuplicateWhatsappConversations: delete duplicate lead failed", delLeadErr.message);
        }
      } else {
        const { error: upLeadErr } = await supabase
          .from("leads")
          .update({ ticket_id: newTicket, updated_at: now })
          .eq("id", oldLeadId);
        if (upLeadErr) {
          console.warn("consolidateDuplicateWhatsappConversations: reticket lead failed", upLeadErr.message);
        }
      }
    }

    const { error: delConvErr } = await supabase.from("whatsapp_conversations").delete().eq("id", rid);
    if (delConvErr) {
      console.warn("consolidateDuplicateWhatsappConversations: delete conversation failed", rid, delConvErr.message);
    }
  }
}

/**
 * Satu percakapan per pelanggan (per org): gabungkan semua baris `(org, whatsapp, customer_wa_id)`
 * ke satu `id` kanonik — termasuk jika DB sudah berisi duplikat (sebelumnya filter `length === 1`
 * membuat merge tidak pernah jalan).
 */
async function findExistingWhatsappConversationIdAnyLine(
  supabase: ReturnType<typeof createClient>,
  args: { organizationId: string; customerDigits: string; preferredPhoneNumberId: string },
): Promise<string | null> {
  const { organizationId, customerDigits, preferredPhoneNumberId } = args;
  if (!customerDigits) return null;
  const { data: rowsRaw, error } = await supabase
    .from("whatsapp_conversations")
    .select("id, phone_number_id, customer_wa_id, last_message_at, created_at")
    .eq("organization_id", organizationId)
    .eq("channel", "whatsapp")
    .eq("customer_wa_id", customerDigits);
  if (error || !rowsRaw?.length) return null;

  const rows: WhatsappConvDedupeRow[] = (rowsRaw as WhatsappConvDedupeRow[]).map((r) => ({
    id: String(r.id ?? "").trim(),
    phone_number_id: r.phone_number_id,
    customer_wa_id: r.customer_wa_id,
    last_message_at: r.last_message_at,
    created_at: r.created_at,
  })).filter((r) => r.id.length > 0);

  if (!rows.length) return null;
  if (rows.length === 1) return rows[0]!.id;

  const keepId = pickCanonicalWhatsappConversationId(rows, preferredPhoneNumberId);
  const removeIds = rows.map((r) => r.id).filter((id) => id !== keepId);
  if (removeIds.length > 0) {
    await consolidateDuplicateWhatsappConversations(supabase, organizationId, keepId, removeIds);
    console.log("findExistingWhatsappConversationIdAnyLine: consolidated duplicate conversations", {
      organization_id: organizationId,
      keep_id: keepId,
      removed_ids: removeIds,
    });
  }
  return keepId;
}

function getMediaIdAndType(msg: Record<string, unknown>): { id: string; type: string; mime?: string; filename?: string } | null {
  const img = msg.image as { id?: string; mime_type?: string } | undefined;
  if (img?.id) return { id: img.id, type: "image", mime: img.mime_type };
  const vid = msg.video as { id?: string; mime_type?: string } | undefined;
  if (vid?.id) return { id: vid.id, type: "video", mime: vid.mime_type };
  const doc = msg.document as { id?: string; mime_type?: string; filename?: string } | undefined;
  if (doc?.id) return { id: doc.id, type: "document", mime: doc.mime_type, filename: doc.filename };
  const aud = msg.audio as { id?: string; mime_type?: string } | undefined;
  if (aud?.id) return { id: aud.id, type: "audio", mime: aud.mime_type };
  return null;
}

/** Caption dari pesan masuk (penerima kirim gambar/video/dokumen + caption). Meta bisa kirim di objek media atau top-level. */
function getInboundMediaCaption(msg: Record<string, unknown>): string | null {
  const trimCaption = (raw: unknown): string | null => {
    if (raw == null) return null;
    const s = String(raw).trim();
    return s !== "" ? s : null;
  };
  // Top-level caption (beberapa versi payload)
  const top = trimCaption(msg.caption);
  if (top) return top;
  // Di dalam objek media: image.caption, video.caption, document.caption
  for (const key of ["image", "video", "document"] as const) {
    const obj = msg[key];
    if (obj && typeof obj === "object" && obj !== null && "caption" in obj) {
      const c = trimCaption((obj as { caption?: unknown }).caption);
      if (c) return c;
    }
  }
  return null;
}

function extensionFromMimeOrFilename(mime?: string, filename?: string): string {
  if (filename && filename.includes(".")) return filename.replace(/^.*\./, "").toLowerCase().slice(0, 8);
  const map: Record<string, string> = {
    "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp",
    "video/mp4": "mp4", "video/3gpp": "3gp",
    "application/pdf": "pdf",
    "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/amr": "amr",
  };
  if (mime) return map[mime.toLowerCase()] ?? mime.split("/")[1]?.slice(0, 8) ?? "bin";
  return "bin";
}

async function resolveInboundMediaUrl(
  mediaId: string,
  accessToken: string,
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  waMessageId: string,
  type: string,
  mime?: string,
  filename?: string
): Promise<string | null> {
  try {
    const metaRes = await fetch(`${META_GRAPH_BASE}/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!metaRes.ok) return null;
    const metaJson = await metaRes.json().catch(() => ({}));
    const downloadUrl = metaJson.url;
    if (!downloadUrl || typeof downloadUrl !== "string") return null;

    const fileRes = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!fileRes.ok) return null;
    const blob = await fileRes.blob();
    const ext = extensionFromMimeOrFilename(mime, filename);
    const safeId = waMessageId.replace(/\W/g, "_");
    const path = `inbound/${conversationId}/${safeId}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from(WHATSAPP_MEDIA_BUCKET).upload(path, blob, {
      contentType: blob.type || undefined,
      upsert: true,
    });
    if (uploadErr) {
      console.error("Webhook storage upload error:", uploadErr);
      return null;
    }
    const { data: urlData } = supabase.storage.from(WHATSAPP_MEDIA_BUCKET).getPublicUrl(path);
    return urlData.publicUrl;
  } catch (e) {
    console.error("resolveInboundMediaUrl error:", e);
    return null;
  }
}

function digitsOnly(s: string | null | undefined): string {
  return String(s ?? "").replace(/\D/g, "");
}

function normalizeClientKey(s: string | null | undefined): string {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Recent LEAD-* rows considered for merge (form submit + first WA message). */
const FORM_LEAD_MERGE_LOOKBACK_MS = 72 * 60 * 60 * 1000;

/**
 * Find a contact-form lead (ticket_id LEAD-…) to merge into this WA thread:
 * 1) same phone as WhatsApp `from`, or
 * 2) same display name as WA profile (`leads.client` vs Meta contact name) when exactly one recent match.
 */
async function findMergeableFormLeadId(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  opts: { customerWaId: string; waProfileClientLabel: string },
): Promise<string | null> {
  const phone = String(opts.customerWaId ?? "").trim();
  if (!phone) return null;

  const since = new Date(Date.now() - FORM_LEAD_MERGE_LOOKBACK_MS).toISOString();
  const { data: rows } = await supabase
    .from("leads")
    .select("id, phone_number, client, created_at")
    .eq("organization_id", orgId)
    .like("ticket_id", "LEAD-%")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(250);

  const list = rows ?? [];

  for (const r of list) {
    if (r.phone_number != null && String(r.phone_number).trim() !== "" && waPhonesMatch(String(r.phone_number), phone)) {
      return r.id;
    }
  }

  // Hub forms store phone on lead_submissions when leads.phone_number is still empty.
  const { data: submissions } = await supabase
    .from("lead_submissions")
    .select("lead_id, phone_number")
    .eq("organization_id", orgId)
    .gte("created_at", since)
    .not("phone_number", "is", null)
    .limit(400);

  const checkedSubmissionLeads = new Set<string>();
  for (const p of submissions ?? []) {
    const ph = p.phone_number;
    if (ph == null || String(ph).trim() === "") continue;
    if (!waPhonesMatch(String(ph), phone)) continue;
    const lid = String(p.lead_id ?? "");
    if (!lid || checkedSubmissionLeads.has(lid)) continue;
    checkedSubmissionLeads.add(lid);
    const { data: leadRow } = await supabase
      .from("leads")
      .select("id, ticket_id")
      .eq("id", lid)
      .eq("organization_id", orgId)
      .maybeSingle();
    const tid = String(leadRow?.ticket_id ?? "");
    if (leadRow?.id && tid.toUpperCase().startsWith("LEAD")) return leadRow.id as string;
  }

  const labelRaw = String(opts.waProfileClientLabel ?? "").trim();
  const label = normalizeClientKey(labelRaw);
  if (label.length < 3) return null;
  if (label === "whatsapp") return null;
  if (/^\d+$/.test(label.replace(/\s/g, ""))) return null;
  if (digitsOnly(labelRaw) === digitsOnly(phone) && digitsOnly(phone).length >= 9) return null;

  const nameMatches = list.filter((r: any) => {
    const c = normalizeClientKey(r.client ?? "");
    return c.length >= 3 && c === label;
  });
  if (nameMatches.length === 1) return nameMatches[0].id as string;

  // Last resort: in this window, only one form lead has empty phone_number (common for Elementor → WA template flows).
  const noPhoneLeads = list.filter((r: any) => !r.phone_number || String(r.phone_number).trim() === "");
  if (noPhoneLeads.length === 1) return noPhoneLeads[0].id as string;

  return null;
}

/** Match WhatsApp `from` to `leads.phone_number` (62 / 0 / missing country code). */
function waPhonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const tail = (x: string, n: number) => (x.length <= n ? x : x.slice(-n));
  for (const n of [15, 12, 11, 10, 9]) {
    const ta = tail(da, n);
    const tb = tail(db, n);
    if (ta.length >= 9 && ta === tb) return true;
  }
  return false;
}

const WA_TICKET_PREFIX = "WA-";

/**
 * When a website/contact-form lead (ticket_id LEAD-…) already exists for the same number,
 * reuse that row: set ticket_id to WA-… so Leads shows one row with Open Chat + form fields.
 * If an auto-generated WA-only lead already exists, delete it first (frees unique ticket_id).
 */
async function reconcileFormLeadWithWaTicket(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  convId: string,
  customerWaId: string,
  waProfileClientLabel: string,
): Promise<void> {
  const ticketId = WA_TICKET_PREFIX + String(convId).replace(/-/g, "").slice(0, 8).toUpperCase();
  const { data: waTicketLead } = await supabase
    .from("leads")
    .select("id, ticket_id")
    .eq("organization_id", orgId)
    .eq("ticket_id", ticketId)
    .maybeSingle();

  const formLeadId = await findMergeableFormLeadId(supabase, orgId, {
    customerWaId,
    waProfileClientLabel: waProfileClientLabel || customerWaId,
  });
  if (!formLeadId) return;

  if (waTicketLead && waTicketLead.id !== formLeadId) {
    const { data: waLeadFull } = await supabase
      .from("leads")
      .select("analytics_session_id, attribution, web_id")
      .eq("id", waTicketLead.id)
      .maybeSingle();
    const waIsSessionRich =
      (waLeadFull?.analytics_session_id != null && String(waLeadFull.analytics_session_id).trim() !== "") ||
      leadAttributionIsMeaningful(waLeadFull?.attribution);
    if (waIsSessionRich) {
      const { data: formLead } = await supabase
        .from("leads")
        .select("attribution, analytics_session_id, web_id")
        .eq("id", formLeadId)
        .maybeSingle();
      const now = new Date().toISOString();
      const phone = String(customerWaId).trim();
      const patch: Record<string, unknown> = {
        ticket_id: ticketId,
        phone_number: phone || null,
        updated_at: now,
      };
      if (!leadAttributionIsMeaningful(formLead?.attribution) && leadAttributionIsMeaningful(waLeadFull?.attribution)) {
        patch.attribution = waLeadFull?.attribution ?? null;
      }
      if (
        (formLead?.analytics_session_id == null || String(formLead.analytics_session_id).trim() === "") &&
        waLeadFull?.analytics_session_id != null &&
        String(waLeadFull.analytics_session_id).trim() !== ""
      ) {
        patch.analytics_session_id = waLeadFull.analytics_session_id;
      }
      if (
        (formLead?.web_id == null || String(formLead.web_id).trim() === "") &&
        waLeadFull?.web_id != null &&
        String(waLeadFull.web_id).trim() !== ""
      ) {
        patch.web_id = waLeadFull.web_id;
      }
      const { error: mergeUpErr } = await supabase.from("leads").update(patch).eq("id", formLeadId);
      if (mergeUpErr) {
        console.error("reconcileFormLeadWithWaTicket: merge WA rich fields into form lead failed", mergeUpErr);
        return;
      }
      const { error: wSubErr } = await supabase
        .from("lead_submissions")
        .update({ lead_id: formLeadId })
        .eq("lead_id", waTicketLead.id);
      if (wSubErr) {
        console.warn("reconcileFormLeadWithWaTicket: repoint lead_submissions failed", wSubErr.message);
      }
      const { error: delRichErr } = await supabase.from("leads").delete().eq("id", waTicketLead.id);
      if (delRichErr) {
        console.error("reconcileFormLeadWithWaTicket: delete merged WA stub failed", delRichErr);
        return;
      }
      console.log("reconcileFormLeadWithWaTicket: merged rich WA stub into form lead", {
        kept_lead_id: formLeadId,
        removed_wa_lead_id: waTicketLead.id,
        ticket_id: ticketId,
      });
      return;
    }
    const { error: delErr } = await supabase.from("leads").delete().eq("id", waTicketLead.id);
    if (delErr) {
      console.error("reconcileFormLeadWithWaTicket: delete duplicate WA lead failed", delErr);
      return;
    }
  }

  const now = new Date().toISOString();
  const phone = String(customerWaId).trim();
  const { error: upErr } = await supabase
    .from("leads")
    .update({
      ticket_id: ticketId,
      phone_number: phone || null,
      updated_at: now,
    })
    .eq("id", formLeadId);
  if (upErr) {
    console.error("reconcileFormLeadWithWaTicket: update form lead failed", upErr);
    return;
  }
  console.log("reconcileFormLeadWithWaTicket: merged into form lead", { lead_id: formLeadId, ticket_id: ticketId });
}

/** Repo ini = Vialdi Wedding; nomor marketing agency lama tetap dipetakan ke `web_id` wedding untuk CRM/analytics. */
/** CRM client names set on floating click before we know the visitor's name. */
const WA_FLOATING_STUB_CLIENTS = new Set(["Klik WhatsApp", "—"]);

function shouldReplaceWaFloatingStubClient(current: string | null | undefined): boolean {
  const c = (current ?? "").trim();
  return !c || WA_FLOATING_STUB_CLIENTS.has(c);
}

function resolveClientWebIdFromDisplayPhoneNumber(
  displayPhoneNumber: string | null | undefined,
): "vialdi-wedding" | null {
  const d = digitsOnly(displayPhoneNumber ?? null);
  if (d === "6281281714855" || d === "6281118891308") return "vialdi-wedding";
  return null;
}

function leadAttributionIsMeaningful(att: unknown): boolean {
  if (att == null) return false;
  if (typeof att === "object" && !Array.isArray(att)) return Object.keys(att as Record<string, unknown>).length > 0;
  if (typeof att === "string") return att.trim().length > 0;
  return false;
}

/**
 * Pilih baris `analytics_wa_clicks` yang relevan untuk inbound WA.
 * `wedding-package-lead` mengisi `phone_number` di klik dengan nomor form — filter `.is(null)` saja
 * membuat merge session gagal dan muncul lead stub kedua (attribution NULL).
 */
function pickWaClickRowForInboundSession(
  rows: Array<{ session_id?: unknown; phone_number?: unknown }> | null | undefined,
  inboundCustomerDigits: string | null | undefined,
): { session_id: string } | null {
  if (!rows?.length) return null;
  const digits = String(inboundCustomerDigits ?? "").replace(/\D/g, "");
  const rowSession = (r: { session_id?: unknown; phone_number?: unknown }) => {
    const sid = r.session_id != null ? String(r.session_id).trim() : "";
    const ph = r.phone_number != null ? String(r.phone_number).trim() : "";
    return { sid, ph };
  };
  if (digits) {
    for (const r of rows) {
      const { sid, ph } = rowSession(r);
      if (!sid || !ph) continue;
      if (waPhonesMatch(ph, digits)) return { session_id: sid };
    }
  }
  for (const r of rows) {
    const { sid, ph } = rowSession(r);
    if (!sid) continue;
    if (!ph) return { session_id: sid };
  }
  return null;
}

/**
 * Floating WhatsApp click (`analytics_wa_clicks`) carries `session_id`. Contact / package funnels
 * create `leads` rows with the same `analytics_session_id` + `web_id` before the first inbound WA.
 * Merge the WA ticket into that row so we do not insert a second lead with NULL attribution.
 */
async function findMergeableSessionLeadFromLatestWaClick(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  displayPhoneNumber: string | null | undefined,
  inboundTimestampIso: string,
  inboundCustomerDigits: string | null | undefined,
): Promise<{ leadId: string } | null> {
  const webId = resolveClientWebIdFromDisplayPhoneNumber(displayPhoneNumber);
  if (!webId) return null;

  const { data: waRows, error: waSelErr } = await supabase
    .from("analytics_wa_clicks")
    .select("session_id, phone_number")
    .eq("web_id", webId)
    .lte("created_at", inboundTimestampIso)
    .order("created_at", { ascending: false })
    .limit(25);
  if (waSelErr) return null;

  const waClick = pickWaClickRowForInboundSession(waRows, inboundCustomerDigits);
  if (!waClick?.session_id) return null;

  const sessionId = String(waClick.session_id);
  const { data: leadRows, error: leadErr } = await supabase
    .from("leads")
    .select("id, ticket_id, attribution, created_at")
    .eq("organization_id", orgId)
    .eq("analytics_session_id", sessionId)
    .eq("web_id", webId)
    .order("created_at", { ascending: false })
    .limit(25);
  if (leadErr || !leadRows?.length) return null;

  const ticketMergeable = (tid: unknown) => {
    const t = String(tid ?? "").trim();
    if (!t) return true;
    return t.toUpperCase().startsWith("LEAD");
  };

  const mergeable = leadRows.filter((r: { ticket_id?: unknown }) => ticketMergeable(r.ticket_id));
  if (!mergeable.length) return null;

  mergeable.sort(
    (
      a: { attribution?: unknown; created_at?: unknown },
      b: { attribution?: unknown; created_at?: unknown },
    ) => {
      const aAttr = leadAttributionIsMeaningful(a.attribution) ? 0 : 1;
      const bAttr = leadAttributionIsMeaningful(b.attribution) ? 0 : 1;
      if (aAttr !== bAttr) return aAttr - bAttr;
      return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
    },
  );
  const id = mergeable[0]?.id;
  return typeof id === "string" && id.trim() ? { leadId: id.trim() } : null;
}

/** Remove extra `leads` rows for the same session+web_id with no attribution (e.g. WA stub insert). */
async function dedupeSessionLeadsAfterWaAttributionPatch(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  keepLeadId: string,
  sessionId: string,
  webId: string,
): Promise<void> {
  const { data: siblings, error } = await supabase
    .from("leads")
    .select("id, attribution, ticket_id")
    .eq("organization_id", orgId)
    .eq("analytics_session_id", sessionId)
    .eq("web_id", webId)
    .neq("id", keepLeadId);
  if (error || !siblings?.length) return;

  for (const s of siblings) {
    if (leadAttributionIsMeaningful(s.attribution)) continue;
    const tid = String(s.ticket_id ?? "").trim();
    if (tid.toUpperCase().startsWith("LEAD")) continue;
    const { error: delErr } = await supabase.from("leads").delete().eq("id", s.id);
    if (delErr) {
      console.warn("dedupeSessionLeadsAfterWaAttributionPatch: delete failed", delErr);
    }
  }
}

/** Insert a lead row when a new WhatsApp conversation is created. Link by ticket_id (WA-xxx). */
async function ensureLeadForNewConversation(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  convId: string,
  channel: "whatsapp",
  client: string,
  title: string,
  customerWaId: string | null | undefined,
  createdByDisplayName: string,
  displayPhoneNumber?: string | null,
  inboundTimestampIso?: string,
): Promise<void> {
  const ticketId = WA_TICKET_PREFIX + String(convId).replace(/-/g, "").slice(0, 8).toUpperCase();
  const { data: existing } = await supabase.from("leads").select("id").eq("ticket_id", ticketId).maybeSingle();
  if (existing) return;

  const { data: unreadStatus } = await supabase
    .from("lead_statuses")
    .select("id")
    .eq("name", "Unread")
    .limit(1)
    .maybeSingle();
  const statusId = unreadStatus?.id ?? null;
  if (!statusId) {
    console.warn("ensureLeadForNewConversation: no Unread status in lead_statuses, skip lead insert");
    return;
  }

  const source = "WhatsApp";
  const safeClient = (client && String(client).trim()) || source;
  const safeTitle = (title && String(title).trim().slice(0, 100)) || source;
  const phoneNumber = source === "WhatsApp" && customerWaId ? String(customerWaId).trim() || null : null;
  const inboundTs = inboundTimestampIso?.trim() || new Date().toISOString();

  if (phoneNumber) {
    const sessionLead = await findMergeableSessionLeadFromLatestWaClick(
      supabase,
      orgId,
      displayPhoneNumber ?? null,
      inboundTs,
      phoneNumber,
    );
    if (sessionLead) {
      const now = new Date().toISOString();
      const { data: sessionLeadRow } = await supabase
        .from("leads")
        .select("client")
        .eq("id", sessionLead.leadId)
        .maybeSingle();
      const sessionMergePatch: Record<string, unknown> = {
        ticket_id: ticketId,
        phone_number: phoneNumber,
        updated_at: now,
      };
      if (shouldReplaceWaFloatingStubClient(sessionLeadRow?.client as string | undefined)) {
        sessionMergePatch.client = safeClient;
      }
      const { error: sessionMergeErr } = await supabase
        .from("leads")
        .update(sessionMergePatch)
        .eq("id", sessionLead.leadId);
      if (!sessionMergeErr) {
        console.log("ensureLeadForNewConversation: merged WA ticket into session-scoped lead", {
          lead_id: sessionLead.leadId,
          ticket_id: ticketId,
        });
        return;
      }
      console.warn("ensureLeadForNewConversation: session-scoped merge failed", sessionMergeErr);
    }

    const formLeadId = await findMergeableFormLeadId(supabase, orgId, {
      customerWaId: phoneNumber,
      waProfileClientLabel: safeClient,
    });
    if (formLeadId) {
      const now = new Date().toISOString();
      const { error: mergeErr } = await supabase
        .from("leads")
        .update({
          ticket_id: ticketId,
          phone_number: phoneNumber,
          updated_at: now,
        })
        .eq("id", formLeadId);
      if (mergeErr) {
        console.error("ensureLeadForNewConversation: merge into form lead failed", mergeErr);
      } else {
        console.log("ensureLeadForNewConversation: merged WA ticket into existing form lead", {
          lead_id: formLeadId,
          ticket_id: ticketId,
        });
      }
      return;
    }
  }

  const { error } = await supabase.from("leads").insert({
    ticket_id: ticketId,
    client: safeClient,
    title: safeTitle,
    category: "",
    created_by: "00000000-0000-0000-0000-000000000000",
    created_by_name: createdByDisplayName,
    assignee: "",
    status_id: statusId,
    organization_id: orgId,
    source,
    services: null,
    followup: 0,
    phone_number: phoneNumber,
  });
  if (error) {
    console.error("ensureLeadForNewConversation: insert error", error);
    return;
  }
  console.log("ensureLeadForNewConversation: lead created", { ticket_id: ticketId, source });
}

async function ensureLeadsVialdiWeddingFromAnalyticsWaClick(args: {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  convId: string;
  customerWaId: string;
  customerName: string | null;
  displayPhoneNumber: string | null;
  timestampIso: string;
}): Promise<void> {
  const { supabase, orgId, convId, customerWaId, customerName, displayPhoneNumber, timestampIso } = args;

  const webId = resolveClientWebIdFromDisplayPhoneNumber(displayPhoneNumber);
  if (!webId) return;

  const ticketId = WA_TICKET_PREFIX + String(convId).replace(/-/g, "").slice(0, 8).toUpperCase();

  try {
    // Must already exist because `ensureLeadForNewConversation` ran, but be defensive.
    const { data: leadRow, error: leadSelErr } = await supabase
      .from("leads")
      .select("id, client")
      .eq("organization_id", orgId)
      .eq("ticket_id", ticketId)
      .maybeSingle();

    if (leadSelErr) {
      console.warn("ensureLeadsVialdiWeddingFromAnalyticsWaClick: leads select error", leadSelErr);
      return;
    }
    const leadId = leadRow?.id;
    if (!leadId) return;

    // Klik terbaru per web (boleh sudah punya phone_number dari form) — cocokkan ke nomor inbound bila ada.
    const { data: waRows, error: waSelErr } = await supabase
      .from("analytics_wa_clicks")
      .select("id, session_id, attribution, phone_number")
      .eq("web_id", webId)
      .lte("created_at", timestampIso)
      .order("created_at", { ascending: false })
      .limit(25);

    if (waSelErr) {
      console.warn("ensureLeadsVialdiWeddingFromAnalyticsWaClick: analytics_wa_clicks select error", waSelErr);
      return;
    }

    let waClick: { id: string; session_id: string; attribution: unknown } | null = null;
    const rowParts = (r: { id?: unknown; session_id?: unknown; attribution?: unknown; phone_number?: unknown }) => {
      const id = r.id != null ? String(r.id).trim() : "";
      const sid = r.session_id != null ? String(r.session_id).trim() : "";
      const ph = r.phone_number != null ? String(r.phone_number).trim() : "";
      return { id, sid, ph, attribution: r.attribution };
    };
    const custDigits = String(customerWaId ?? "").replace(/\D/g, "");
    if (custDigits) {
      for (const r of waRows ?? []) {
        const row = rowParts(r as { id?: unknown; session_id?: unknown; attribution?: unknown; phone_number?: unknown });
        if (!row.id || !row.sid || !row.ph) continue;
        if (waPhonesMatch(row.ph, custDigits)) {
          waClick = { id: row.id, session_id: row.sid, attribution: row.attribution };
          break;
        }
      }
    }
    if (!waClick) {
      for (const r of waRows ?? []) {
        const row = rowParts(r as { id?: unknown; session_id?: unknown; attribution?: unknown; phone_number?: unknown });
        if (!row.id || !row.sid) continue;
        if (!row.ph) {
          waClick = { id: row.id, session_id: row.sid, attribution: row.attribution };
          break;
        }
      }
    }
    const analyticsSessionId = waClick?.session_id;
    if (!waClick?.id || !analyticsSessionId) return;

    const sessionGclid = await resolveSessionGclid(supabase, analyticsSessionId);

    const safeName = (customerName ?? customerWaId ?? "WhatsApp").toString().trim().slice(0, 200);

    // Persist sender phone on analytics row (so later lead functions can rely on it).
    const { error: waUpdErr } = await supabase
      .from("analytics_wa_clicks")
      .update({ phone_number: customerWaId })
      .eq("id", waClick.id);

    if (waUpdErr) {
      // Non-fatal: still proceed with lead insert.
      console.warn("ensureLeadsVialdiWeddingFromAnalyticsWaClick: analytics_wa_clicks update error", waUpdErr);
    }

    const { data: existingDraft } = await supabase
      .from("lead_submissions")
      .select("id, lead_id, form_data, name, phone_number, email, package_label, gclid")
      .eq("web_id", webId)
      .eq("organization_id", orgId)
      .eq("analytics_session_id", analyticsSessionId)
      .eq("form_id", "contact-main")
      .eq("status", "draft")
      .maybeSingle();

    const draftGclid =
      existingDraft?.gclid != null && String(existingDraft.gclid).trim()
        ? String(existingDraft.gclid).trim()
        : null;
    const resolvedGclid = sessionGclid ?? draftGclid ?? null;

    // Patch CRM `leads` so attribution/session/web_id are never NULL for matched WA clicks.
    // This is safe/idempotent: update by (org_id, ticket_id) which is unique for WA threads.
    const leadPatch: Record<string, unknown> = {
      web_id: webId,
      analytics_session_id: analyticsSessionId,
      attribution: waClick?.attribution ?? null,
      phone_number: customerWaId || null,
      updated_at: new Date().toISOString(),
      ...(resolvedGclid ? { gclid: resolvedGclid } : {}),
    };
    if (shouldReplaceWaFloatingStubClient(leadRow?.client as string | undefined)) {
      leadPatch.client = safeName;
    }
    const { error: leadPatchErr } = await supabase
      .from("leads")
      .update(leadPatch)
      .eq("organization_id", orgId)
      .eq("ticket_id", ticketId);

    // Floating-click stub may still exist as LEAD-* before ticket merge; refresh name there too.
    if (safeName || resolvedGclid) {
      const stubPatch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        ...(safeName ? { client: safeName } : {}),
        ...(resolvedGclid ? { gclid: resolvedGclid } : {}),
      };
      const { error: stubPatchErr } = await supabase
        .from("leads")
        .update(stubPatch)
        .eq("organization_id", orgId)
        .eq("analytics_session_id", analyticsSessionId)
        .eq("web_id", webId)
        .in("client", Array.from(WA_FLOATING_STUB_CLIENTS));
      if (stubPatchErr) {
        console.warn("ensureLeadsVialdiWeddingFromAnalyticsWaClick: stub lead client patch error", stubPatchErr);
      }
    }

    if (leadPatchErr) {
      console.warn("ensureLeadsVialdiWeddingFromAnalyticsWaClick: leads patch error", leadPatchErr);
    } else {
      await dedupeSessionLeadsAfterWaAttributionPatch(
        supabase,
        orgId,
        String(leadId),
        String(analyticsSessionId),
        webId,
      );
    }

    const priorForm =
      existingDraft?.form_data && typeof existingDraft.form_data === "object" &&
        !Array.isArray(existingDraft.form_data)
        ? (existingDraft.form_data as Record<string, unknown>)
        : {};
    const mergedFormData: Record<string, unknown> = {
      ...priorForm,
      name: safeName,
      phone_number: customerWaId || null,
    };

    const hubRow: Record<string, unknown> = {
      web_id: webId,
      form_id: "contact-main",
      form_version: 1,
      step: 1,
      status: "draft",
      form_data: mergedFormData,
      name: safeName,
      phone_number: customerWaId || null,
      email: existingDraft?.email ?? null,
      package_label:
        (existingDraft?.package_label != null && String(existingDraft.package_label).trim())
          ? String(existingDraft.package_label).trim()
          : "WhatsApp",
      organization_id: orgId,
      lead_id: String(leadId),
      analytics_session_id: analyticsSessionId,
      attribution: waClick?.attribution ?? null,
      attribution_label: null,
      ...(resolvedGclid ? { gclid: resolvedGclid } : {}),
    };

    if (existingDraft?.id) {
      const { error: hubUpdErr } = await supabase
        .from("lead_submissions")
        .update(hubRow)
        .eq("id", existingDraft.id);
      if (hubUpdErr) {
        console.warn(
          "ensureLeadsVialdiWeddingFromAnalyticsWaClick: lead_submissions update error",
          hubUpdErr,
        );
      }
    } else {
      const { error: hubInsErr } = await supabase.from("lead_submissions").insert(hubRow);
      if (hubInsErr) {
        console.warn(
          "ensureLeadsVialdiWeddingFromAnalyticsWaClick: lead_submissions insert error",
          hubInsErr,
        );
      }
    }
  } catch (e) {
    console.warn("ensureLeadsVialdiWeddingFromAnalyticsWaClick: unexpected error", e);
  }
}

/** Inline: Supabase deploy bundle resolves `index.ts` reliably; local `./notifyLivechatSendPush` import can fail to bundle. */
type LivechatPushTable = "whatsapp_messages" | "instagram_messages" | "email_messages";

function livechatPushUsesDatabaseWebhookOnly(): boolean {
  return Deno.env.get("LIVECHAT_USE_DATABASE_WEBHOOK_FOR_PUSH") === "true";
}

async function notifyLivechatInboundPush(
  table: LivechatPushTable,
  record: Record<string, unknown>,
): Promise<void> {
  if (livechatPushUsesDatabaseWebhookOnly()) return;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("notifyLivechatInboundPush: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/livechat-send-push`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        type: "INSERT",
        table,
        schema: "public",
        record,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("notifyLivechatInboundPush: livechat-send-push HTTP error", res.status, t.slice(0, 800));
    }
  } catch (e) {
    console.error("notifyLivechatInboundPush: fetch failed", e);
  }
}

/** === NEW: keep only high-signal fields + preserve `errors` === */
function pickWhatsappStatusForDebug(st: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ["id", "status", "timestamp", "recipient_id", "conversation", "pricing", "errors"] as const) {
    if (k in st) out[k] = st[k];
  }
  return out;
}

/** === NEW: update status + merge error detail into raw_metadata.whatsapp_webhook === */
async function updateWhatsappMessageStatusWithDebug(args: {
  supabase: ReturnType<typeof createClient>;
  waMessageId: string;
  status: string;
  statusTimestampIso: string;
  statusPayload: Record<string, unknown>;
}) {
  const { supabase, waMessageId, status, statusTimestampIso, statusPayload } = args;

  const { data: row } = await supabase
    .from("whatsapp_messages")
    .select("raw_metadata")
    .eq("wa_message_id", waMessageId)
    .maybeSingle();

  const oldMeta =
    row?.raw_metadata && typeof row.raw_metadata === "object" && !Array.isArray(row.raw_metadata)
      ? (row.raw_metadata as Record<string, unknown>)
      : {};

  const oldWebhook =
    oldMeta.whatsapp_webhook && typeof oldMeta.whatsapp_webhook === "object" && !Array.isArray(oldMeta.whatsapp_webhook)
      ? (oldMeta.whatsapp_webhook as Record<string, unknown>)
      : {};

  const nowIso = new Date().toISOString();

  // ring buffer history (last 20)
  const prevHistoryRaw = oldWebhook.status_history;
  const prevHistory = Array.isArray(prevHistoryRaw) ? prevHistoryRaw : [];
  const nextHistory = [
    ...prevHistory,
    {
      received_at: nowIso,
      status_updated_at: statusTimestampIso,
      status,
      payload: pickWhatsappStatusForDebug(statusPayload),
    },
  ].slice(-20);

  const nextMeta: Record<string, unknown> = {
    ...oldMeta,
    whatsapp_webhook: {
      ...oldWebhook,
      last_status: pickWhatsappStatusForDebug(statusPayload),
      last_status_received_at: nowIso,
      status_history: nextHistory,
    },
  };

  await supabase
    .from("whatsapp_messages")
    .update({
      status,
      status_updated_at: statusTimestampIso,
      raw_metadata: nextMeta,
    })
    .eq("wa_message_id", waMessageId);
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const ts = new Date().toISOString();
  console.log(
    "[whatsapp-webhook] ENTRY",
    ts,
    req.method,
    url.pathname,
    req.method === "GET" ? "query=" + url.searchParams.toString().slice(0, 80) : "body=..."
  );

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode !== "subscribe" || !token || !challenge) {
        console.log("[whatsapp-webhook] GET: not Meta verify (mode=" + mode + "), returning 200 for ping");
        return new Response("whatsapp-webhook ok\n" + new Date().toISOString(), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }

      console.log("Webhook GET: verification (hub.mode=subscribe), checking verify_token...");
      let verified = false;

      const { data: account, error } = await supabase
        .from("organization_whatsapp_accounts")
        .select("id")
        .eq("verify_token", token)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Webhook GET: DB error on organization_whatsapp_accounts", error);
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
      if (account) {
        verified = true;
      }

      if (!verified) {
        const { data: metaRow, error: metaError } = await supabase
          .from("organization_meta_config")
          .select("id")
          .eq("verify_token", token)
          .eq("is_active", true)
          .maybeSingle();
        if (metaError) {
          console.error("Webhook GET: DB error on organization_meta_config", metaError);
          return new Response("Forbidden", { status: 403, headers: corsHeaders });
        }
        if (metaRow) verified = true;
      }

      if (!verified) {
        console.error(
          "Webhook GET: Verify token not found in organization_whatsapp_accounts or organization_meta_config (no matching config)"
        );
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }

      console.log("Webhook GET: verification success, returning challenge");
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch((e) => {
        console.error("[whatsapp-webhook] POST body parse failed", e);
        return {};
      });
      const objectType = body?.object ?? "(none)";
      const entryCount = (body?.entry ?? []).length;
      console.log("[whatsapp-webhook] POST received object=", objectType, "entryCount=", entryCount);
      const firstEntry = body?.entry?.[0];
      const firstChange = firstEntry?.changes?.[0];
      const firstValue = firstChange?.value ?? {};
      const firstPhoneId = firstValue?.metadata?.phone_number_id ?? firstValue?.phone_number_id;
      if (firstPhoneId != null) {
        console.log("[whatsapp-webhook] POST first phone_number_id from payload:", String(firstPhoneId));
      }

      if (body.object === "whatsapp_business_account") {
        const entries = body.entry ?? [];
        for (const entry of entries) {
          // Meta sends WhatsApp Business Account ID (WABA ID) in entry.id – validate so we only process for the correct WABA
          const rawWabaId = entry.id != null ? String(entry.id).trim() || null : null;
          const whatsappBusinessAccountId = rawWabaId && rawWabaId.length > 0 ? rawWabaId : null;

          const changes = entry.changes ?? [];
          for (const change of changes) {
            if (change.field === "messages") {
              const value = change.value ?? {};
              const rawPhoneNumberId = value.metadata?.phone_number_id ?? value.phone_number_id;
              const phoneNumberId = rawPhoneNumberId != null ? String(rawPhoneNumberId).trim() || null : null;
              const contacts = value.contacts ?? [];
              const messages = value.messages ?? [];
              const statuses = value.statuses ?? [];

              if (whatsappBusinessAccountId) {
                console.log(
                  "[whatsapp-webhook] POST entry whatsapp_business_account_id=",
                  whatsappBusinessAccountId,
                  "phone_number_id=",
                  phoneNumberId ?? "(none)"
                );
              }

              // Status updates (sent | delivered | read | failed): inbox raw_metadata + campaign blast recipients
              for (const st of statuses) {
                const waMessageId = st.id != null ? String(st.id).trim() : "";
                const status = st.status != null ? String(st.status).trim() : "";
                const statusTimestamp = st.timestamp
                  ? new Date(Number(st.timestamp) * 1000).toISOString()
                  : new Date().toISOString();
                if (!waMessageId || !status) continue;

                await updateWhatsappMessageStatusWithDebug({
                  supabase,
                  waMessageId,
                  status,
                  statusTimestampIso: statusTimestamp,
                  statusPayload: st as Record<string, unknown>,
                });

                const { data: campRec } = await supabase
                  .from("whatsapp_campaign_recipients")
                  .select("id, wa_delivery_status")
                  .eq("wa_message_id", waMessageId)
                  .maybeSingle();

                if (campRec && typeof campRec === "object" && "id" in campRec) {
                  const row = campRec as { id: string; wa_delivery_status: string | null };
                  if (shouldUpgradeMetaDelivery(row.wa_delivery_status, status)) {
                    await supabase
                      .from("whatsapp_campaign_recipients")
                      .update({ wa_delivery_status: status, wa_delivery_status_at: statusTimestamp })
                      .eq("id", row.id);
                  }
                }
              }

              if (!phoneNumberId || messages.length === 0) {
                if (phoneNumberId && messages.length === 0 && (value.statuses ?? []).length === 0) {
                  console.log("Webhook: phone_number_id=", phoneNumberId, "has no messages and no statuses in this payload, skipping");
                }
                continue;
              }

              // Resolve orgs by phone_number_id from organization_whatsapp_accounts only (no fallback to organization_meta_config).
              type OrgAccount = {
                organization_id: string;
                meta_access_token: string;
                created_by_display_name: string;
                display_phone_number: string | null;
              };
              let accountsList: OrgAccount[] = [];

              const { data: accountRows, error: accountError } = await supabase
                .from("organization_whatsapp_accounts")
                .select("organization_id, meta_access_token, whatsapp_business_account_id, whatsapp_business_name, display_phone_number, phone_number_id")
                .eq("phone_number_id", phoneNumberId)
                .eq("is_active", true);

              if (!accountError && accountRows?.length) {
                let rows = accountRows as Array<{
                  organization_id: string;
                  meta_access_token: string | null;
                  whatsapp_business_account_id: string | null;
                  whatsapp_business_name: string | null;
                  display_phone_number: string | null;
                  phone_number_id: string | null;
                }>;
                if (whatsappBusinessAccountId) {
                  const wabaMatched = rows.filter((r) => (r.whatsapp_business_account_id ?? "").trim() === whatsappBusinessAccountId);
                  const wabaNull = rows.filter((r) => !(r.whatsapp_business_account_id ?? "").trim());
                  rows = wabaMatched.length > 0 ? wabaMatched : wabaNull;
                }
                accountsList = rows
                  .map((r) => {
                    const name =
                      (r.whatsapp_business_name ?? "").trim() ||
                      (r.display_phone_number ?? "").trim() ||
                      (r.phone_number_id ?? "").trim() ||
                      "WhatsApp";
                    return {
                      organization_id: r.organization_id,
                      meta_access_token: (r.meta_access_token ?? "").trim(),
                      created_by_display_name: name,
                      display_phone_number: r.display_phone_number ?? null,
                    };
                  })
                  .filter((a) => a.meta_access_token && a.organization_id);
              }

              if (accountsList.length === 0) {
                console.error(
                  "Config not found for phone_number_id:",
                  phoneNumberId,
                  whatsappBusinessAccountId ? "whatsapp_business_account_id:" + whatsappBusinessAccountId : "",
                  accountError ?? null
                );
                continue;
              }

              // Dedupe by organization_id (keep first)
              const seenOrgIds = new Set<string>();
              accountsList = accountsList.filter((a) => {
                if (seenOrgIds.has(a.organization_id)) return false;
                seenOrgIds.add(a.organization_id);
                return true;
              });

              console.log(
                "Webhook: resolved accounts for phone_number_id=",
                phoneNumberId,
                whatsappBusinessAccountId ? "waba_id=" + whatsappBusinessAccountId : "",
                "org_count=",
                accountsList.length,
                "messages_count=",
                messages.length
              );

              const contactMap: Record<string, string> = {};
              for (const c of contacts) {
                if (c.wa_id && c.profile?.name) {
                  contactMap[c.wa_id] = c.profile.name;
                  const d = waCustomerDigits(c.wa_id);
                  if (d) contactMap[d] = c.profile.name;
                }
              }
              const sortedMessages = [...messages].sort(
                (a, b) => (Number(a.timestamp ?? 0) - Number(b.timestamp ?? 0))
              );
              const blockContactRequests = Deno.env.get("WHATSAPP_BLOCK_CONTACT_REQUESTS") !== "false";

              for (const account of accountsList) {
                const orgId = account.organization_id;
                const accessToken = account.meta_access_token;
                if (!accessToken) {
                  console.error("No token for org/phone_number_id:", orgId, phoneNumberId);
                  continue;
                }

                const defaultConversationLeadStatusId = await fetchDefaultConversationLeadStatusId(supabase, orgId);

                // Backfill display_phone_number on organization_whatsapp_accounts from webhook metadata
                const rawDisplayNumber = value.metadata?.display_phone_number;
                if (rawDisplayNumber != null) {
                  let displayNumber =
                    typeof rawDisplayNumber === "number"
                      ? String(rawDisplayNumber)
                      : (typeof rawDisplayNumber === "string" ? rawDisplayNumber.trim() : "");
                  if (displayNumber && /^\d+$/.test(displayNumber)) displayNumber = `+${displayNumber}`;
                  if (displayNumber) {
                    await supabase
                      .from("organization_whatsapp_accounts")
                      .update({ display_phone_number: displayNumber, updated_at: new Date().toISOString() })
                      .eq("organization_id", orgId)
                      .eq("phone_number_id", phoneNumberId);
                  }
                }

                for (const msg of sortedMessages) {
                  if (msg.type === "unsupported") {
                    continue;
                  }
                  const customerWaRaw = String(msg.from ?? "");
                  const customerDigits = waCustomerDigits(customerWaRaw);
                  const mediaCaption = getInboundMediaCaption(msg as Record<string, unknown>);
                  const bodyText =
                    msg.text?.body ?? mediaCaption ?? (msg.type === "text" ? "" : `[${msg.type}]`);
                  if (blockContactRequests && messageContainsContactRequest(bodyText)) {
                    continue;
                  }
                  const msgId = msg.id;
                  const timestamp = msg.timestamp
                    ? new Date(Number(msg.timestamp) * 1000).toISOString()
                    : new Date().toISOString();
                  const customerName =
                    contactMap[customerWaRaw] ?? (customerDigits ? contactMap[customerDigits] : null) ?? null;

                  const lastBody = typeof bodyText === "string" ? bodyText.slice(0, 200) : "";
                  const convPayload: Record<string, unknown> = {
                    organization_id: orgId,
                    customer_wa_id: customerDigits,
                    customer_external_id: customerDigits,
                    channel: "whatsapp",
                    phone_number_id: phoneNumberId,
                    last_message_at: timestamp,
                    last_message_body: lastBody,
                    last_inbound_at: timestamp,
                    updated_at: timestamp,
                  };
                  if (defaultConversationLeadStatusId) {
                    convPayload.lead_status_id = defaultConversationLeadStatusId;
                  }
                  if (customerName) convPayload.customer_name = customerName;

                  // One conversation per (org, channel, customer, phone_number_id) – list and messages separated by account (Synckerja, Vialdi Wedding, etc.).
                  const existingConvId = await findExistingWhatsappConversationId(supabase, {
                    organizationId: orgId,
                    phoneNumberId,
                    customerDigits,
                  });

                  let conv: { id: string } | null = null;
                  if (existingConvId) {
                    const { data: updated } = await supabase
                      .from("whatsapp_conversations")
                      .update({
                        phone_number_id: phoneNumberId,
                        customer_wa_id: customerDigits,
                        customer_external_id: customerDigits,
                        last_message_at: timestamp,
                        last_message_body: lastBody,
                        last_inbound_at: timestamp,
                        customer_name: customerName ?? undefined,
                        updated_at: timestamp,
                      })
                      .eq("id", existingConvId)
                      .select("id")
                      .single();
                    conv = updated;
                  } else {
                    const { data: inserted, error: insertErr } = await supabase
                      .from("whatsapp_conversations")
                      .insert(convPayload)
                      .select("id")
                      .single();
                    if (insertErr) {
                      console.error("Conversation insert error", insertErr);
                      continue;
                    }
                    conv = inserted;
                    await ensureLeadForNewConversation(
                      supabase,
                      orgId,
                      conv!.id,
                      "whatsapp",
                      customerName ?? customerDigits ?? "WhatsApp",
                      lastBody ?? "WhatsApp",
                      customerDigits,
                      account.created_by_display_name,
                      account.display_phone_number ?? null,
                      timestamp,
                    );
                  }

                  if (!conv) {
                    continue;
                  }

                  await reconcileFormLeadWithWaTicket(
                    supabase,
                    orgId,
                    conv.id,
                    customerDigits,
                    customerName ?? customerDigits ?? "",
                  );

                  // Link CRM lead + attribution from `analytics_wa_clicks` (floating click); await so dedupe runs before downstream reads.
                  await ensureLeadsVialdiWeddingFromAnalyticsWaClick({
                    supabase,
                    orgId,
                    convId: conv.id,
                    customerWaId: customerDigits,
                    customerName: customerName ?? null,
                    displayPhoneNumber: account.display_phone_number,
                    timestampIso: timestamp,
                  });

                  let mediaUrl: string | null = null;
                  const mediaInfo = getMediaIdAndType(msg as Record<string, unknown>);
                  if (mediaInfo && accessToken) {
                    mediaUrl = await resolveInboundMediaUrl(
                      mediaInfo.id,
                      accessToken,
                      supabase,
                      conv.id,
                      msgId,
                      mediaInfo.type,
                      mediaInfo.mime,
                      mediaInfo.filename
                    );
                    if (!mediaUrl) {
                      console.warn(
                        "Inbound media resolution failed (Meta or storage). Message will show [image] + Tampilkan gambar.",
                        { msgId, type: mediaInfo.type }
                      );
                    }
                  }

                  const insertPayload: Record<string, unknown> = {
                    conversation_id: conv.id,
                    direction: "inbound",
                    wa_message_id: msgId,
                    platform_message_id: msgId,
                    channel: "whatsapp",
                    body: bodyText,
                    message_type: msg.type ?? "text",
                    raw_metadata: msg,
                    created_at: timestamp,
                  };
                  if (mediaUrl) insertPayload.media_url = mediaUrl;

                  // Inbound reply context: extract context.reply_to so UI can show reply preview
                  const msgRaw = msg as Record<string, unknown>;
                  const context = msgRaw?.context as { reply_to?: { id?: string }; id?: string } | undefined;
                  const replyToId = context?.reply_to?.id ?? context?.id;
                  if (replyToId && typeof replyToId === "string") {
                    const replyToWaMessageId = replyToId.trim();
                    if (replyToWaMessageId) {
                      insertPayload.reply_to_wa_message_id = replyToWaMessageId;
                      const { data: repliedToRow } = await supabase
                        .from("whatsapp_messages")
                        .select("body, message_type, direction")
                        .eq("conversation_id", conv.id)
                        .eq("wa_message_id", replyToWaMessageId)
                        .maybeSingle();
                      if (repliedToRow) {
                        const repliedBody = repliedToRow.body;
                        const repliedType = (repliedToRow.message_type ?? "text") as string;
                        insertPayload.reply_to_body =
                          repliedBody != null && repliedBody !== ""
                            ? String(repliedBody).slice(0, 500)
                            : ["image", "video", "document", "audio"].includes(repliedType.toLowerCase())
                              ? `[${repliedType}]`
                              : "[Pesan]";
                        insertPayload.reply_to_message_type = repliedType;
                        insertPayload.reply_to_sender =
                          repliedToRow.direction === "outbound" ? "You" : (customerName ?? customerDigits ?? "Contact");
                      } else {
                        insertPayload.reply_to_body = "[Pesan]";
                      }
                    }
                  }

                  const { error: waInsertErr } = await supabase.from("whatsapp_messages").insert(insertPayload);
                  if (waInsertErr) {
                    console.error("whatsapp_messages insert error", waInsertErr);
                    continue;
                  }
                  await notifyLivechatInboundPush("whatsapp_messages", insertPayload);
                  // Sync last_message from actual latest message so preview is always correct
                  await supabase.rpc("sync_conversation_last_message", { p_conversation_id: conv.id });

                  // Resolve-cycle tracking: first_inbound_at, re-open to Unread (Open), new cycle when Closed or new conv
                  const { data: convRow } = await supabase
                    .from("whatsapp_conversations")
                    .select("lead_status_id, first_inbound_at")
                    .eq("id", conv.id)
                    .single();
                  const statusId = convRow?.lead_status_id ?? null;
                  const firstInboundAt = convRow?.first_inbound_at ?? null;
                  let leadStatusName: string | null = null;
                  if (statusId) {
                    const { data: statusRow } = await supabase
                      .from("lead_statuses")
                      .select("name")
                      .eq("id", statusId)
                      .maybeSingle();
                    leadStatusName = (statusRow?.name as string) ?? null;
                  }
                  // Prefer "Open", fallback "Unread". Include global statuses (organization_id IS NULL) for all tenants.
                  const orgOrGlobal = `organization_id.eq.${orgId},organization_id.is.null`;
                  const { data: openStatus } = await supabase
                    .from("lead_statuses")
                    .select("id")
                    .or(orgOrGlobal)
                    .eq("name", "Open")
                    .maybeSingle();
                  const { data: unreadStatus } = openStatus?.id
                    ? { data: null }
                    : await supabase.from("lead_statuses").select("id").or(orgOrGlobal).eq("name", "Unread").maybeSingle();
                  const openStatusId = openStatus?.id ?? unreadStatus?.id ?? null;

                  if (firstInboundAt == null) {
                    await supabase
                      .from("whatsapp_conversations")
                      .update({ first_inbound_at: timestamp, last_inbound_at: timestamp, updated_at: timestamp })
                      .eq("id", conv.id);
                  }

                  const statusNameLower = leadStatusName?.trim().toLowerCase() ?? "";
                  const isResolved = statusNameLower === "closed" || statusNameLower === "resolve";
                  const isNewOrReopen = openStatusId && (statusId == null || isResolved);
                  console.log("Resolve-cycle:", {
                    conversation_id: conv.id,
                    leadStatusName,
                    isResolved,
                    openStatusId: openStatusId ?? "MISSING",
                    isNewOrReopen,
                  });
                  if (isNewOrReopen) {
                    const { data: convBefore } = await supabase
                      .from("whatsapp_conversations")
                      .select("organization_id, ticket_id")
                      .eq("id", conv.id)
                      .maybeSingle();
                    const { error: updateErr } = await supabase
                      .from("whatsapp_conversations")
                      .update({ lead_status_id: openStatusId, last_inbound_at: timestamp, updated_at: timestamp })
                      .eq("id", conv.id);
                    if (updateErr) {
                      console.error("Reopen to Open (Unread) update error:", updateErr);
                    } else {
                      console.log("Reopened conversation to Open (Unread):", conv.id, { openStatusId, hadStatus: statusId });
                    }
                    if (convBefore?.organization_id && openStatusId) {
                      const ticketId = (convBefore.ticket_id as string) ?? `WA-${conv.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
                      const { error: leadErr } = await supabase
                        .from("leads")
                        .update({ status_id: openStatusId, updated_at: timestamp })
                        .eq("organization_id", convBefore.organization_id)
                        .eq("ticket_id", ticketId);
                      if (leadErr) console.error("Reopen: sync leads.status_id to Open failed:", leadErr);
                    }
                    const { error: cycleErr } = await supabase.from("whatsapp_conversation_cycles").insert({
                      conversation_id: conv.id,
                      cycle_started_at: timestamp,
                    });
                    if (cycleErr) console.error("New cycle insert error:", cycleErr);
                  } else if (isResolved && !openStatusId) {
                    console.warn("Cannot reopen: lead_statuses has no row with name 'Open' or 'Unread' (org or global). Add Open or Unread status in DB.");
                  }
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Webhook failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
