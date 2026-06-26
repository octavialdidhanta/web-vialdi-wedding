import type { AnalyticsWebId, LeadAttributionPayload } from "@/analytics/sendAnalyticsBatch";
import { getOrCreateSessionId } from "@/analytics/sendAnalyticsBatch";
import {
  buildLeadPayload,
  trackLead,
  type SynckerjaLeadResponse,
  type SynckerjaWhatsappSkipReason,
  type SynckerjaWhatsappStatus,
} from "@/analytics/synckerjaApi";
import { getRequiredWebId } from "@/share/cmsPropertySlug";
import { normalizePhone } from "@/contact/leadValidators";

export { leadSessionStorageKey } from "@/contact/hubLeadSession";

export type ContactSubmitBody = {
  web_id?: string;
  form_id?: string;
  step: number;
  id?: string;
  form_data: Record<string, unknown>;
  package_label?: string;
  property_package_id?: string;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
  gclid?: string | null;
};

export type WeddingLeadStep1 = {
  step: 1;
  name: string;
  phone_number: string;
  email: string;
  package_label: string;
  property_package_id?: string;
  id?: string;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
  web_id?: AnalyticsWebId;
};

export type WeddingLeadStep2 = {
  step: 2;
  name: string;
  phone_number: string;
  email: string;
  package_label: string;
  property_package_id?: string;
  event_date: string;
  event_time: string;
  event_address: string;
  consent?: boolean;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
  web_id?: AnalyticsWebId;
};

export type WeddingLeadResponse = {
  id: string;
  lead_id: string;
  ticket_id?: string;
  retry_after_seconds?: number;
  /** Synckerja v1.4.15 — konfirmasi WA + thread livechat setelah POST /leads */
  whatsapp_status?: SynckerjaWhatsappStatus;
  whatsapp_message_id?: string | null;
  whatsapp_ticket_id?: string | null;
  whatsapp_conversation_id?: string | null;
  whatsapp_skip_reason?: SynckerjaWhatsappSkipReason | string | null;
};

export type ContactSubmitResponse = WeddingLeadResponse & {
  submission_id: string;
};

const LEAD_SUBMIT_TTL_MS = 30_000;
const LEAD_SUBMIT_STORAGE_KEY = "vw_lead_submit_ttl_v1";

function leadSubmitTtlKey(webId: string): string {
  return `${LEAD_SUBMIT_STORAGE_KEY}_${webId}`;
}

function markLeadSubmitted(webId: string): void {
  try {
    sessionStorage.setItem(leadSubmitTtlKey(webId), String(Date.now()));
  } catch {
    /* ignore */
  }
}

function assertLeadSubmitAllowed(webId: string): void {
  try {
    const raw = sessionStorage.getItem(leadSubmitTtlKey(webId));
    if (!raw) return;
    const at = Number(raw);
    if (!Number.isFinite(at)) return;
    const elapsed = Date.now() - at;
    if (elapsed < LEAD_SUBMIT_TTL_MS) {
      const err = new Error("Lead sudah pernah dikirim untuk session ini") as Error & {
        retry_after_seconds?: number;
      };
      err.retry_after_seconds = Math.ceil((LEAD_SUBMIT_TTL_MS - elapsed) / 1000);
      throw err;
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("Lead sudah pernah")) throw e;
  }
}

function weddingPayloadToSynckerjaBody(payload: WeddingLeadStep2): Record<string, unknown> {
  return buildLeadPayload({
    session_id: payload.analytics_session_id ?? getOrCreateSessionId(),
    name: payload.name.trim(),
    phone_number: normalizePhone(payload.phone_number) || payload.phone_number.trim(),
    email: payload.email.trim(),
    package_label: payload.package_label,
    property_package_id: payload.property_package_id,
    event_date: payload.event_date,
    event_time: payload.event_time,
    event_address: payload.event_address,
    consent: payload.consent ?? true,
    form_id: "contact-main",
    source_label: "Website form — contact-main",
  });
}

function logWhatsappOutcome(res: SynckerjaLeadResponse): void {
  if (!import.meta.env.DEV) return;
  const reason = res.whatsapp_skip_reason?.trim();
  const debug = res.whatsapp_debug;
  if (reason?.startsWith("persist_failed:")) {
    console.warn("[synckerja] WhatsApp sent but livechat persist failed:", reason, debug ?? "");
    return;
  }
  if (res.whatsapp_status === "skipped" && reason) {
    console.warn("[synckerja] WhatsApp skipped:", reason, debug ?? "");
  } else if (res.whatsapp_status === "failed") {
    console.warn(
      "[synckerja] WhatsApp failed:",
      reason || "(no whatsapp_skip_reason)",
      debug ?? "(no whatsapp_debug — cek mapping template di Synckerja Office)",
    );
  }
}

function normalizeSynckerjaLeadResponse(data: SynckerjaLeadResponse): WeddingLeadResponse {
  const leadId = data.lead_id != null ? String(data.lead_id) : "";
  const ticketId = data.ticket_id != null ? String(data.ticket_id) : leadId;
  return {
    id: ticketId || leadId,
    lead_id: leadId,
    ticket_id: data.ticket_id != null ? String(data.ticket_id) : undefined,
    whatsapp_status: data.whatsapp_status,
    whatsapp_message_id: data.whatsapp_message_id,
    whatsapp_ticket_id: data.whatsapp_ticket_id ?? undefined,
    whatsapp_conversation_id: data.whatsapp_conversation_id ?? undefined,
    whatsapp_skip_reason: data.whatsapp_skip_reason,
  };
}

/** Submit final wedding lead (step 2) via Synckerja Omnichannel API.
 *  v1.4.15: session_id yang sama dengan klik WA meng-upgrade stub lead, bukan duplikat.
 */
export async function submitWeddingPackageLead(payload: WeddingLeadStep2): Promise<WeddingLeadResponse> {
  const webId = payload.web_id ?? getRequiredWebId();
  assertLeadSubmitAllowed(webId);

  const res = await trackLead(weddingPayloadToSynckerjaBody(payload));
  logWhatsappOutcome(res);
  const normalized = normalizeSynckerjaLeadResponse(res);
  if (!normalized.lead_id && !normalized.id) {
    throw new Error("Respons Synckerja tidak valid (lead_id kosong).");
  }
  markLeadSubmitted(webId);
  return normalized;
}

/** @deprecated Step-1 server draft removed — use local-only autosave hook. */
export async function submitContactHub(_payload: ContactSubmitBody): Promise<ContactSubmitResponse> {
  throw new Error("submitContactHub tidak lagi tersedia — gunakan submitWeddingPackageLead (step 2).");
}
