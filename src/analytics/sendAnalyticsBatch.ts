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

const LANDING_SNAPSHOT_PREFIX = "vialdi_analytics_landing_v1";

function landingSnapshotKey(): string {
  return `${LANDING_SNAPSHOT_PREFIX}_${getRequiredWebId()}`;
}

const MAX_LANDING_URL = 1000;
const MAX_UTM_FIELD = 200;

function clip(s: string, max: number): string {
  if (s.length <= max) {
    return s;
  }
  return s.slice(0, max);
}

/** Parsed once per browser tab (sessionStorage) so UTM survives SPA navigasi. */
export type LandingAttributionSnapshot = {
  landing_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  has_gclid?: boolean;
  has_fbclid?: boolean;
  has_msclkid?: boolean;
  has_gbraid?: boolean;
  has_wbraid?: boolean;
};

/** Panggil di mount layout publik agar UTM tidak hilang sebelum `startPage` (idle). */
export function ensureLandingAttributionCaptured(): void {
  readLandingAttributionOnce();
}

function readLandingAttributionOnce(): LandingAttributionSnapshot {
  if (typeof window === "undefined") {
    return {};
  }
  const key = landingSnapshotKey();
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const o = JSON.parse(raw) as unknown;
      if (o && typeof o === "object") {
        return o as LandingAttributionSnapshot;
      }
    }
  } catch {
    // ignore corrupt snapshot
  }

  let snap: LandingAttributionSnapshot = {};
  try {
    const url = new URL(window.location.href);
    const sp = url.searchParams;
    const q = (name: string) => {
      const v = sp.get(name);
      return v != null && v.trim() !== "" ? clip(v.trim(), MAX_UTM_FIELD) : undefined;
    };
    const hasNonEmptyParam = (name: string) => {
      const v = sp.get(name);
      return v != null && v.trim() !== "";
    };
    snap = {
      landing_url: clip(`${url.pathname}${url.search}`, MAX_LANDING_URL),
      utm_source: q("utm_source"),
      utm_medium: q("utm_medium"),
      utm_campaign: q("utm_campaign"),
      utm_content: q("utm_content"),
      utm_term: q("utm_term"),
      has_gclid: hasNonEmptyParam("gclid"),
      has_fbclid: hasNonEmptyParam("fbclid"),
      has_msclkid: hasNonEmptyParam("msclkid"),
      has_gbraid: hasNonEmptyParam("gbraid"),
      has_wbraid: hasNonEmptyParam("wbraid"),
    };
    sessionStorage.setItem(key, JSON.stringify(snap));
  } catch {
    snap = {};
  }
  return snap;
}

export type IngestEvent =
  | {
      type: "session_touch";
      referrer?: string;
      ua_hash?: string;
      auth_user_id?: string | null;
      landing_url?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
      utm_term?: string;
      has_gclid?: boolean;
      has_fbclid?: boolean;
      has_msclkid?: boolean;
      has_gbraid?: boolean;
      has_wbraid?: boolean;
    }
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

/**
 * Menjadwalkan POST ingest agar tidak menggantung critical path Lighthouse:
 * hindari `queueMicrotask` langsung dari idle callback (tetap tercatat sebagai rantai panjang).
 *
 * @param leadMs — jeda tambahan setelah `load` (hanya untuk batch tertentu) agar fetch tidak
 *   berebut bandwidth dengan LCP (gambar hero, font); membantu metrik PSI/PageSpeed.
 */
function scheduleDeferredIngest(run: () => void, leadMs = 0) {
  if (typeof window === "undefined") {
    queueMicrotask(run);
    return;
  }

  const afterPaint = () => {
    const chain = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (typeof requestIdleCallback === "function") {
            requestIdleCallback(
              () => {
                /** Memutus tautan idle → fetch di waterfall Lighthouse (task terpisah). */
                setTimeout(() => void run(), 0);
              },
              { timeout: 12_000 },
            );
          } else {
            setTimeout(() => void run(), 400);
          }
        });
      });
    };
    if (leadMs > 0) {
      window.setTimeout(chain, leadMs);
    } else {
      chain();
    }
  };

  if (document.readyState === "complete") {
    afterPaint();
  } else {
    window.addEventListener("load", afterPaint, { once: true });
  }
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
    const { supabase } = await import("@/share/supabaseClient");
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
    /**
     * Default `true`: hindari memuat `@supabase/supabase-js` di bundle utama untuk tiap ping/klik.
     * Set `false` hanya jika ingest membutuhkan `auth_user_id` dari sesi Supabase.
     */
    skipAuthLookup?: boolean;
    /** Jangan tunggu respons fetch di task saat ini (memutus tautan kritis Lighthouse). */
    deferNetwork?: boolean;
    /** Setelah `load`, tunggu dulu (ms) sebelum rantai rAF/idle — dipakai page_view awal. */
    deferNetworkLeadMs?: number;
  },
): Promise<void> {
  if (events.length === 0) {
    return;
  }
  const session_id = getOrCreateSessionId();
  const web_id = getRequiredWebId();
  const skipAuthLookup = options?.skipAuthLookup ?? true;
  const auth_user_id = skipAuthLookup
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
    scheduleDeferredIngest(
      () => {
        void runFetch();
      },
      options.deferNetworkLeadMs ?? 0,
    );
    return;
  }

  await runFetch();
}

export function buildSessionTouchEvent(): IngestEvent {
  const referrer = typeof document !== "undefined" ? document.referrer || undefined : undefined;
  const land = readLandingAttributionOnce();
  return {
    type: "session_touch",
    referrer: referrer?.slice(0, 500),
    ua_hash: simpleUaHash(),
    landing_url: land.landing_url,
    utm_source: land.utm_source,
    utm_medium: land.utm_medium,
    utm_campaign: land.utm_campaign,
    utm_content: land.utm_content,
    utm_term: land.utm_term,
    has_gclid: land.has_gclid,
    has_fbclid: land.has_fbclid,
    has_msclkid: land.has_msclkid,
    has_gbraid: land.has_gbraid,
    has_wbraid: land.has_wbraid,
  };
}
