import type { LeadAttributionPayload } from "@/analytics/sendAnalyticsBatch";
import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
import type { AnalyticsWebId } from "@/analytics/trackRegistry";
import { clearWeddingPackageLeadBrowserSession } from "@/contact/weddingPackageLeadSession";

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

export type WeddingLeadStep1 = {
  step: 1;
  name: string;
  phone_number: string;
  email: string;
  package_label: string;
  /** Kirim saat autosave ulang agar satu baris diperbarui, bukan duplikat. */
  id?: string;
  attribution?: LeadAttributionPayload;
  /** Link to analytics_sessions.id for attribution join. */
  analytics_session_id?: string;
  /** Keperluan debug; server memvalidasi allowed list juga. */
  web_id?: AnalyticsWebId;
};

export type WeddingLeadStep2 = {
  step: 2;
  id: string;
  /** Hanya untuk `web_id: vialdi-wedding` (tanggal acara). */
  event_date?: string;
  event_time: string;
  event_address: string;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
  web_id?: AnalyticsWebId;
  /** Wajib untuk `web_id: vialdi` — disimpan di `leads_vialdiid`. */
  industry?: string;
  business_type?: "B2B" | "B2C";
  job_title?: string;
  needs?: string;
  office_address?: string;
  ringkasan_kebutuhan?: string;
};

/** Step 1 & step 2 both return id + lead_id; step 2 adds whatsapp status from Edge Function. */
export type WeddingLeadResponse = {
  id: string;
  lead_id: string;
  retry_after_seconds?: number;
  whatsapp?: {
    sent: boolean;
    skipped?: boolean;
    message_id?: string | null;
    /** Set when skipped: secrets WA belum di Edge Function, dll. */
    skip_reason?: string;
    error?: string;
  };
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
  const o = parsed as Record<string, unknown>;
  const v = o.retry_after_seconds;
  if (typeof v !== "number") return null;
  if (!Number.isFinite(v) || v <= 0) return null;
  return Math.floor(v);
}

function isRepeatLeadMessage(message: string): boolean {
  return message.trim().includes("Lead sudah pernah dikirim untuk session ini");
}

/**
 * Supabase `functions.invoke` mengembalikan `FunctionsHttpError` dengan `context` = `Response`
 * (bukan `{ body: string }`). Tanpa ini, pengguna hanya melihat "Edge Function returned a non-2xx status code".
 */
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
        return { message: `Edge Function mengembalikan HTTP ${res.status} tanpa pesan. Periksa log fungsi di Supabase Dashboard.` };
      } catch {
        return { message: `Edge Function mengembalikan HTTP ${res.status}.` };
      }
    }
  }
  if (error instanceof FunctionsRelayError) {
    return { message: error.message || "Edge Function tidak terjangkau (relay). Pastikan `wedding-package-lead` sudah di-deploy." };
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

/** Step 1 UPDATE: baris `id` tidak ada (session lama / DB reset / project lain). */
function isStaleStep1LeadRowMessage(message: string): boolean {
  const m = message.trim();
  return (
    m.includes("Lead tidak ditemukan") ||
    /lead not found/i.test(m) ||
    // Row exists but already progressed to step 2 (locked for step 1 edits).
    m.includes("Lead sudah tidak bisa diubah dari form ini") ||
    // Dedupe constraint (single draft per session) can surface as a DB unique violation.
    /uq_leads_vialdi_wedding_step1_dedupe/i.test(m) ||
    /uq_leads_vialdiid_step1_dedupe/i.test(m) ||
    /duplicate key value/i.test(m)
  );
}

export async function submitWeddingPackageLead(
  payload: WeddingLeadStep1 | WeddingLeadStep2,
): Promise<WeddingLeadResponse> {
  const { supabase } = await import("@/share/supabaseClient");
  const { data, error } = await supabase.functions.invoke("wedding-package-lead", {
    body: payload,
  });
  if (!error) {
    return data as WeddingLeadResponse;
  }

  const { message, retryAfterSeconds } = await formatFunctionsInvokeError(error);

  if (
    payload.step === 1 &&
    typeof payload.id === "string" &&
    payload.id.trim().length > 0 &&
    isStaleStep1LeadRowMessage(message)
  ) {
    try {
      clearWeddingPackageLeadBrowserSession(getRequiredWebId());
    } catch {
      /* VITE_WEB_ID */
    }
    const { id: _stale, ...insertPayload } = payload;
    const retry = await supabase.functions.invoke("wedding-package-lead", {
      body: insertPayload,
    });
    if (retry.error) {
      const formatted = await formatFunctionsInvokeError(retry.error);
      const err = new Error(formatted.message) as Error & { retry_after_seconds?: number };
      if (formatted.retryAfterSeconds) err.retry_after_seconds = formatted.retryAfterSeconds;
      throw err;
    }
    return retry.data as WeddingLeadResponse;
  }

  const err = new Error(message) as Error & { retry_after_seconds?: number };
  if (retryAfterSeconds) err.retry_after_seconds = retryAfterSeconds;
  // Some paths return the repeat message without retry_after_seconds; fall back to TTL.
  if (!err.retry_after_seconds && isRepeatLeadMessage(message)) err.retry_after_seconds = 30;
  throw err;
}
