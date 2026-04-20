import type { LeadAttributionPayload } from "@/analytics/sendAnalyticsBatch";
import { supabase } from "@/share/supabaseClient";

export type ContactLeadStep1 = {
  step: 1;
  name: string;
  phone_number: string;
  email: string;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
};
export type ContactLeadStep2 = {
  step: 2;
  id: string;
  industry: string;
  business_type: "B2B" | "B2C";
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
};
export type ContactLeadStep3 = {
  step: 3;
  id: string;
  job_title: string;
  needs: string;
  office_address: string;
  attribution?: LeadAttributionPayload;
  analytics_session_id?: string;
};

export type ContactLeadResponse = { id: string; lead_id: string };

function tryParseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Sertakan `attribution: readLandingAttributionForLead()` dari `@/analytics/sendAnalyticsBatch` pada setiap step. */
export async function submitContactLead(
  payload: ContactLeadStep1 | ContactLeadStep2 | ContactLeadStep3,
): Promise<ContactLeadResponse> {
  const { data, error } = await supabase.functions.invoke("contact-lead", { body: payload });
  if (error) {
    const bodyText = (error as any)?.context?.body;
    if (typeof bodyText === "string") {
      const parsed = tryParseJson(bodyText);
      const message =
        (parsed && typeof parsed?.error === "string" && parsed.error) ||
        (parsed && typeof parsed?.message === "string" && parsed.message) ||
        bodyText;
      throw new Error(message);
    }
    throw error;
  }
  return data as ContactLeadResponse;
}

