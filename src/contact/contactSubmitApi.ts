import type { AnalyticsWebId, LeadAttributionPayload } from "@/analytics/sendAnalyticsBatch";
import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
import {
  clearHubLeadBrowserSession,
  HUB_CONTACT_FORM_ID,
  leadSessionStorageKey,
} from "@/contact/hubLeadSession";

export { leadSessionStorageKey };

type SupabaseFunctionsErrors = {
  FunctionsFetchError: typeof import("@supabase/supabase-js").FunctionsFetchError;
  FunctionsHttpError: typeof import("@supabase/supabase-js").FunctionsHttpError;
  FunctionsRelayError: typeof import("@supabase/supabase-js").FunctionsRelayError;
};

let supabaseFunctionsErrorsP: Promise<SupabaseFunctionsErrors> | null = null;

function loadSupabaseFunctionsErrors(): Promise<SupabaseFunctionsErrors> {
  if (!supabaseFunctionsErrorsP) {
    supabaseFunctionsErrorsP = import("@supabase/supabase-js").then((m) => ({
      FunctionsFetchError: m.FunctionsFetchError,
      FunctionsHttpError: m.FunctionsHttpError,
      FunctionsRelayError: m.FunctionsRelayError,
    }));
  }
  return supabaseFunctionsErrorsP;
}

export type ContactSubmitBody = {
  web_id?: string;
  form_id?: string;
  step: number;
  id?: string;
  form_data: Record<string, unknown>;
  package_label?: string;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
};

export type WeddingLeadStep1 = {
  step: 1;
  name: string;
  phone_number: string;
  email: string;
  package_label: string;
  id?: string;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
  web_id?: AnalyticsWebId;
};

export type WeddingLeadStep2 = {
  step: 2;
  id: string;
  event_date: string;
  event_time: string;
  event_address: string;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
  web_id?: AnalyticsWebId;
};

export type WeddingLeadResponse = {
  id: string;
  lead_id: string;
  retry_after_seconds?: number;
  whatsapp?: {
    sent: boolean;
    skipped?: boolean;
    message_id?: string | null;
    skip_reason?: string;
    error?: string;
  };
};

export type ContactSubmitResponse = WeddingLeadResponse & {
  submission_id: string;
};

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function messageFromParsedBody(parsed: unknown): string | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (typeof o.error === "string" && o.error.trim()) return o.error.trim();
  if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
  return null;
}

function retryAfterSecondsFromParsedBody(parsed: unknown): number | null {
  if (!parsed || typeof parsed !== "object") return null;
  const v = (parsed as Record<string, unknown>).retry_after_seconds;
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return Math.floor(v);
}

function isRepeatLeadMessage(message: string): boolean {
  return message.trim().includes("Lead sudah pernah dikirim untuk session ini");
}

async function formatFunctionsInvokeError(error: unknown): Promise<{ message: string; retryAfterSeconds?: number }> {
  const { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } = await loadSupabaseFunctionsErrors();

  if (error instanceof FunctionsHttpError) {
    const ctx = error.context as unknown;
    if (ctx && typeof ctx === "object" && typeof (ctx as Response).text === "function") {
      const res = ctx as Response;
      try {
        const text = await res.text();
        const parsed = tryParseJson(text);
        const fromJson = messageFromParsedBody(parsed);
        const retryAfter = retryAfterSecondsFromParsedBody(parsed);
        if (fromJson) return { message: fromJson, ...(retryAfter ? { retryAfterSeconds: retryAfter } : {}) };
        const trimmed = text.trim();
        if (trimmed) return { message: trimmed.slice(0, 800) };
        return {
          message: `Edge Function mengembalikan HTTP ${res.status} tanpa pesan. Periksa log fungsi di Supabase Dashboard.`,
        };
      } catch {
        return { message: `Edge Function mengembalikan HTTP ${res.status}.` };
      }
    }
  }
  if (error instanceof FunctionsRelayError) {
    return {
      message:
        error.message ||
        "Edge Function tidak terjangkau (relay). Pastikan `contact-submit` sudah di-deploy.",
    };
  }
  if (error instanceof FunctionsFetchError) {
    return { message: error.message || "Gagal menghubungi Edge Function (jaringan atau CORS)." };
  }
  const bodyText = (error as { context?: { body?: string } })?.context?.body;
  if (typeof bodyText === "string") {
    const parsed = tryParseJson(bodyText);
    const fromJson = messageFromParsedBody(parsed);
    const retryAfter = retryAfterSecondsFromParsedBody(parsed);
    if (fromJson) return { message: fromJson, ...(retryAfter ? { retryAfterSeconds: retryAfter } : {}) };
    if (bodyText.trim()) return { message: bodyText.trim().slice(0, 800) };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: "Terjadi kesalahan saat menghubungi server." };
}

function isStaleStep1LeadRowMessage(message: string): boolean {
  const m = message.trim();
  return (
    m.includes("Submission not found") ||
    m.includes("Lead tidak ditemukan") ||
    /lead not found/i.test(m) ||
    m.includes("Lead sudah tidak bisa diubah dari form ini") ||
    /uq_leads_vialdi_wedding_step1_dedupe/i.test(m) ||
    /uq_lead_submissions_step1_dedupe/i.test(m) ||
    /duplicate key value/i.test(m)
  );
}

function weddingPayloadToHubBody(payload: WeddingLeadStep1 | WeddingLeadStep2): ContactSubmitBody {
  if (payload.step === 1) {
    return {
      step: 1,
      web_id: payload.web_id,
      form_data: {
        name: payload.name,
        phone_number: payload.phone_number,
        email: payload.email,
      },
      package_label: payload.package_label,
      id: payload.id,
      attribution: payload.attribution,
      analytics_session_id: payload.analytics_session_id,
    };
  }
  return {
    step: 2,
    web_id: payload.web_id,
    id: payload.id,
    form_data: {
      event_date: payload.event_date,
      event_time: payload.event_time,
      event_address: payload.event_address,
      consent: true,
    },
    attribution: payload.attribution,
    analytics_session_id: payload.analytics_session_id,
  };
}

function normalizeHubResponse(data: unknown): WeddingLeadResponse {
  const row = (data ?? {}) as Record<string, unknown>;
  const submissionId = String(row.submission_id ?? row.id ?? "");
  const leadId = row.lead_id != null ? String(row.lead_id) : "";
  const whatsapp = row.whatsapp;
  return {
    id: submissionId,
    lead_id: leadId,
    ...(typeof row.retry_after_seconds === "number" ? { retry_after_seconds: row.retry_after_seconds } : {}),
    ...(whatsapp && typeof whatsapp === "object" ? { whatsapp: whatsapp as WeddingLeadResponse["whatsapp"] } : {}),
  };
}

export async function submitContactHub(payload: ContactSubmitBody): Promise<ContactSubmitResponse> {
  const { supabase } = await import("@/share/supabaseClient");
  const webId = payload.web_id ?? getRequiredWebId();
  const formId = payload.form_id ?? HUB_CONTACT_FORM_ID;

  const { data, error } = await supabase.functions.invoke("contact-submit", {
    body: { ...payload, web_id: webId, form_id: formId },
  });

  if (error) {
    const { message, retryAfterSeconds } = await formatFunctionsInvokeError(error);
    const err = new Error(message) as Error & { retry_after_seconds?: number };
    if (retryAfterSeconds) err.retry_after_seconds = retryAfterSeconds;
    if (!err.retry_after_seconds && isRepeatLeadMessage(message)) err.retry_after_seconds = 30;
    throw err;
  }

  const normalized = normalizeHubResponse(data);
  if (!normalized.id) throw new Error("Invalid response from contact-submit");
  return { ...normalized, submission_id: normalized.id };
}

/** Hub contact-submit with wedding 2-step payload shape (replaces wedding-package-lead). */
export async function submitWeddingPackageLead(
  payload: WeddingLeadStep1 | WeddingLeadStep2,
): Promise<WeddingLeadResponse> {
  const hubBody = weddingPayloadToHubBody(payload);
  const webId = hubBody.web_id ?? getRequiredWebId();

  try {
    return await submitContactHub(hubBody);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const retryAfterSeconds = (e as Error & { retry_after_seconds?: number }).retry_after_seconds;

    if (
      payload.step === 1 &&
      typeof payload.id === "string" &&
      payload.id.trim().length > 0 &&
      isStaleStep1LeadRowMessage(message)
    ) {
      try {
        clearHubLeadBrowserSession(webId);
      } catch {
        /* VITE_WEB_ID */
      }
      const { id: _stale, ...rest } = payload;
      return submitContactHub(weddingPayloadToHubBody(rest as WeddingLeadStep1));
    }

    const err = new Error(message) as Error & { retry_after_seconds?: number };
    if (retryAfterSeconds) err.retry_after_seconds = retryAfterSeconds;
    if (!err.retry_after_seconds && isRepeatLeadMessage(message)) err.retry_after_seconds = 30;
    throw err;
  }
}
