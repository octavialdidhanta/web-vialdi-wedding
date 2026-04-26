import { supabase } from "@/share/supabaseClient";

export const HOME_FLOATING_WHATSAPP_WEB_ID = "vialdi-wedding" as const;

/** React Query — sama di beranda & admin agar invalidasi konsisten. */
export const HOME_FLOATING_WHATSAPP_QUERY_KEY = [
  "home-floating-whatsapp-settings",
  HOME_FLOATING_WHATSAPP_WEB_ID,
] as const;

export type HomeFloatingWhatsappSettingsRow = {
  web_id: string;
  is_enabled: boolean;
  phone_digits: string | null;
  prefill_message: string;
  updated_at: string;
};

const selectCols = "web_id, is_enabled, phone_digits, prefill_message, updated_at" as const;

export async function fetchHomeFloatingWhatsappSettings(): Promise<HomeFloatingWhatsappSettingsRow | null> {
  const { data, error } = await supabase
    .from("home_floating_whatsapp_settings")
    .select(selectCols)
    .eq("web_id", HOME_FLOATING_WHATSAPP_WEB_ID)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export type HomeFloatingWhatsappSettingsSave = {
  is_enabled: boolean;
  phone_digits: string | null;
  prefill_message: string;
};

export async function saveHomeFloatingWhatsappSettings(
  payload: HomeFloatingWhatsappSettingsSave,
): Promise<void> {
  const { error } = await supabase.from("home_floating_whatsapp_settings").upsert(
    {
      web_id: HOME_FLOATING_WHATSAPP_WEB_ID,
      is_enabled: payload.is_enabled,
      phone_digits: payload.phone_digits,
      prefill_message: payload.prefill_message,
    },
    { onConflict: "web_id" },
  );
  if (error) {
    throw error;
  }
}

/** Hanya angka; kosong → null. */
export function normalizePhoneDigits(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length === 0) {
    return null;
  }
  return d;
}

export function buildWaMeUrl(phoneDigits: string, prefillMessage: string): string {
  const base = `https://wa.me/${encodeURIComponent(phoneDigits)}`;
  const t = prefillMessage.trim();
  if (!t) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(t)}`;
}
