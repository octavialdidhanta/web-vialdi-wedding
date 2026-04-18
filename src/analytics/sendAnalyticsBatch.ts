import { supabase } from "@/share/supabaseClient";

const SESSION_STORAGE_KEY = "vialdi_analytics_session_v1";

export type IngestEvent =
  | { type: "session_touch"; referrer?: string; ua_hash?: string; auth_user_id?: string | null }
  | { type: "page_view"; path: string }
  | { type: "active_ping"; path: string; delta_ms: number }
  | { type: "page_end"; path: string }
  | {
      type: "click";
      path: string;
      track_key?: string | null;
      element_type: string;
      element_label: string;
      target_url?: string | null;
      is_internal?: boolean;
    };

function getSupabaseUrl(): string {
  const u = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!u) throw new Error("VITE_SUPABASE_URL");
  return u.replace(/\/$/, "");
}

function getAnonKey(): string {
  const k = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!k) throw new Error("VITE_SUPABASE_ANON_KEY");
  return k;
}

export function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
      return existing;
    }
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function simpleUaHash(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  let h = 0;
  for (let i = 0; i < ua.length; i++) {
    h = (Math.imul(31, h) + ua.charCodeAt(i)) | 0;
  }
  return String(h);
}

export async function getOptionalAuthUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

export async function sendAnalyticsBatch(
  events: IngestEvent[],
  options?: { useBeacon?: boolean; keepalive?: boolean; authUserId?: string | null },
): Promise<void> {
  if (events.length === 0) {
    return;
  }
  const session_id = getOrCreateSessionId();
  const auth_user_id = options?.authUserId ?? (await getOptionalAuthUserId());
  const url = `${getSupabaseUrl()}/functions/v1/analytics-ingest`;
  const anon = getAnonKey();
  const body = JSON.stringify({ session_id, auth_user_id, events });

  const useKeepalive = Boolean(options?.useBeacon) || Boolean(options?.keepalive);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anon}`,
      apikey: anon,
    },
    body,
    keepalive: useKeepalive,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.warn(
      `[analytics] ingest HTTP ${res.status} — pastikan Edge Function analytics-ingest ter-deploy, migrasi analytics aktif, dan (jika pakai ALLOWED_ORIGINS di Supabase) origin persis situs Anda ada di daftar.`,
      detail.slice(0, 200),
    );
  }
}

export function buildSessionTouchEvent(): IngestEvent {
  const referrer = typeof document !== "undefined" ? document.referrer || undefined : undefined;
  return {
    type: "session_touch",
    referrer: referrer?.slice(0, 500),
    ua_hash: simpleUaHash(),
  };
}
