import type { LeadAttributionPayload } from "@/analytics/sendAnalyticsBatch";
import type { AnalyticsWebId } from "@/analytics/trackRegistry";
import { supabase } from "@/share/supabaseClient";

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
  event_date: string;
  event_time: string;
  event_address: string;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
  web_id?: AnalyticsWebId;
};

/** Step 1 & step 2 both return id + lead_id; step 2 adds whatsapp status from Edge Function. */
export type WeddingLeadResponse = {
  id: string;
  lead_id: string;
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

export async function submitWeddingPackageLead(
  payload: WeddingLeadStep1 | WeddingLeadStep2,
): Promise<WeddingLeadResponse> {
  const { data, error } = await supabase.functions.invoke("wedding-package-lead", {
    body: payload,
  });
  if (error) {
    const bodyText = (error as { context?: { body?: string } })?.context?.body;
    if (typeof bodyText === "string") {
      const parsed = tryParseJson(bodyText) as { error?: string; message?: string } | null;
      const message =
        (parsed && typeof parsed?.error === "string" && parsed.error) ||
        (parsed && typeof parsed?.message === "string" && parsed.message) ||
        bodyText;
      throw new Error(message);
    }
    throw error;
  }
  return data as WeddingLeadResponse;
}
