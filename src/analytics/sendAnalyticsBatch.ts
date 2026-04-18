import { supabase } from "@/share/supabaseClient";

const SESSION_KEY_PREFIX = "vialdi_analytics_session_v1";

/** Nilai yang sama dengan CHECK di DB + validasi Edge. */
const ALLOWED_WEB_IDS = ["vialdi", "vialdi-wedding", "synckerja"] as const;
export type AnalyticsWebId = (typeof ALLOWED_WEB_IDS)[number];

/**
 * Mapping konseptual (domain dipilih di deploy / Vercel env, bukan di runtime):
 * - vialdi → vialdi.id
 * - vialdi-wedding → jasafotowedding.com
 * - synckerja → synckerja.com
 */
export function getRequiredWebId(): AnalyticsWebId {
  const raw = (import.meta.env.VITE_WEB_ID as string | undefined)?.trim();
  if (!raw || !(ALLOWED_WEB_IDS as readonly string[]).includes(raw)) {
    throw new Error(`VITE_WEB_ID harus diset ke salah satu: ${ALLOWED_WEB_IDS.join(", ")}`);
  }
  return raw as AnalyticsWebId;
}

function sessionStorageKey(): string {
  return `${SESSION_KEY_PREFIX}_${getRequiredWebId()}`;
}

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
  const key = sessionStorageKey();
  try {
    const existing = localStorage.getItem(key);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
      return existing;
    }
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
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
  options?: {
    useBeacon?: boolean;
    keepalive?: boolean;
    authUserId?: string | null;
    /** Lewati lookup Supabase Auth agar tidak memblokir critical path (mis. page_view awal). */
    skipAuthLookup?: boolean;
    /** Jangan tunggu respons fetch di task saat ini (memutus tautan kritis Lighthouse). */
    deferNetwork?: boolean;
  },
): Promise<void> {
  if (events.length === 0) {
    return;
  }
  const session_id = getOrCreateSessionId();
  const web_id = getRequiredWebId();
  const auth_user_id = options?.skipAuthLookup
    ? (options.authUserId ?? null)
    : (options?.authUserId ?? (await getOptionalAuthUserId()));
  const url = `${getSupabaseUrl()}/functions/v1/analytics-ingest`;
  const anon = getAnonKey();
  const body = JSON.stringify({ session_id, web_id, auth_user_id, events });

  const useKeepalive = Boolean(options?.useBeacon) || Boolean(options?.keepalive);

  const runFetch = async () => {
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
  };

  if (options?.deferNetwork) {
    queueMicrotask(() => {
      void runFetch();
    });
    return;
  }

  await runFetch();
}

export function buildSessionTouchEvent(): IngestEvent {
  const referrer = typeof document !== "undefined" ? document.referrer || undefined : undefined;
  return {
    type: "session_touch",
    referrer: referrer?.slice(0, 500),
    ua_hash: simpleUaHash(),
  };
}
