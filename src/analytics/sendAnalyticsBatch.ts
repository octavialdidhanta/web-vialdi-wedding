import { randomUuidV4 } from "@/share/lib/randomUuid";

const SESSION_KEY_PREFIX = "vw_analytics_session_v1";

/** Nilai yang sama dengan CHECK di DB + validasi Edge. */
const ALLOWED_WEB_IDS = ["vialdi-wedding"] as const;
export type AnalyticsWebId = (typeof ALLOWED_WEB_IDS)[number];

/**
 * Mapping konseptual (domain dipilih di deploy / Vercel env, bukan di runtime):
 * - vialdi-wedding → jasafotowedding.com
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

const LANDING_SNAPSHOT_PREFIX = "vw_analytics_landing_v1";

function landingSnapshotKey(): string {
  return `${LANDING_SNAPSHOT_PREFIX}_${getRequiredWebId()}`;
}

const MAX_LANDING_URL = 1000;
const MAX_REFERRER = 2000;
const MAX_UTM_FIELD = 200;

/**
 * Nilai umum `{{site_source_name}}` / placement Meta (bukan daftar lengkap).
 * Dipakai untuk mengisi kolom meta_* dari UTM bila URL tidak memakai query `meta_*` terpisah.
 */
function isMetaSiteSourceName(raw: string | undefined): boolean {
  if (!raw) return false;
  const s = raw.trim().toLowerCase();
  if (!s) return false;
  const exact = new Set([
    "fb",
    "ig",
    "msg",
    "an",
    "facebook",
    "instagram",
    "messenger",
    "fbinstagram",
    "audience_network",
    "audnetwork",
  ]);
  if (exact.has(s)) return true;
  if (s.includes("facebook") || s.includes("instagram")) return true;
  return false;
}

function clip(s: string, max: number): string {
  if (s.length <= max) {
    return s;
  }
  return s.slice(0, max);
}

/**
 * Snapshot landing per tab (sessionStorage) agar UTM/click-id bertahan navigasi SPA;
 * diperbarui saat navigasi dokumen penuh membawa URL atribusi baru (mis. klik iklan di tab yang sama).
 */
export type LandingAttributionSnapshot = {
  landing_url?: string;
  /** `document.referrer` at snapshot time (first non-empty kept across SPA merges). */
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  /**
   * Preferensi: query `meta_campaign` / `meta_adset` / `meta_ad`.
   * Jika tidak ada, untuk traffic Meta (fbclid atau utm_source placement) kita isi dari UTM
   * sesuai Meta Ads Manager "Campaign URL": campaign→utm_campaign, ad set→utm_medium, ad id→utm_content.
   */
  meta_campaign_name?: string;
  meta_adset_name?: string;
  meta_ad_name?: string;
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

function snapshotHasAttribution(s: LandingAttributionSnapshot): boolean {
  return Boolean(
    s.utm_source ||
      s.utm_medium ||
      s.utm_campaign ||
      s.utm_content ||
      s.utm_term ||
      s.meta_campaign_name ||
      s.meta_adset_name ||
      s.meta_ad_name ||
      s.has_gclid ||
      s.has_fbclid ||
      s.has_msclkid ||
      s.has_gbraid ||
      s.has_wbraid,
  );
}

/** Parse pathname+search + UTM / click-id flags dari URL saat ini. */
function parseLandingFromLocation(): LandingAttributionSnapshot {
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
  const explicitMetaParam =
    hasNonEmptyParam("meta_campaign") ||
    hasNonEmptyParam("meta_adset") ||
    hasNonEmptyParam("meta_ad");

  const out: LandingAttributionSnapshot = {
    landing_url: clip(`${url.pathname}${url.search}`, MAX_LANDING_URL),
    utm_source: q("utm_source"),
    utm_medium: q("utm_medium"),
    utm_campaign: q("utm_campaign"),
    utm_content: q("utm_content"),
    utm_term: q("utm_term"),
    meta_campaign_name: q("meta_campaign"),
    meta_adset_name: q("meta_adset"),
    meta_ad_name: q("meta_ad"),
    has_gclid: hasNonEmptyParam("gclid"),
    has_fbclid: hasNonEmptyParam("fbclid"),
    has_msclkid: hasNonEmptyParam("msclkid"),
    has_gbraid: hasNonEmptyParam("gbraid"),
    has_wbraid: hasNonEmptyParam("wbraid"),
  };

  /**
   * Meta Ads Manager → URL parameter preview umum:
   * utm_source={{site_source_name}}, utm_medium={{adset.name}}, utm_campaign={{campaign.name}}, utm_content={{ad.id}}
   * Tanpa query meta_* terpisah, kolom DB meta_* tetap terisi untuk agregasi dashboard.
   */
  if (!explicitMetaParam && (out.has_fbclid || isMetaSiteSourceName(out.utm_source))) {
    if (out.utm_campaign && !out.meta_campaign_name) {
      out.meta_campaign_name = out.utm_campaign;
    }
    if (out.utm_medium && !out.meta_adset_name) {
      out.meta_adset_name = out.utm_medium;
    }
    if (out.utm_content && !out.meta_ad_name) {
      out.meta_ad_name = out.utm_content;
    }
  }

  if (typeof document !== "undefined") {
    const ref = document.referrer?.trim();
    if (ref) out.referrer = clip(ref, MAX_REFERRER);
  }

  return out;
}

/** Keep first non-empty referrer from session cache (first document.referrer in tab). */
function mergeReferrerPreferFirst(
  primary: LandingAttributionSnapshot,
  fallback?: LandingAttributionSnapshot | null,
): LandingAttributionSnapshot {
  const f = fallback?.referrer?.trim();
  if (f) return { ...primary, referrer: fallback!.referrer };
  return primary;
}

function readLandingAttributionOnce(): LandingAttributionSnapshot {
  if (typeof window === "undefined") {
    return {};
  }
  const key = landingSnapshotKey();

  let cached: LandingAttributionSnapshot | null = null;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const o = JSON.parse(raw) as unknown;
      if (o && typeof o === "object") {
        cached = o as LandingAttributionSnapshot;
      }
    }
  } catch {
    cached = null;
  }

  let parsed: LandingAttributionSnapshot;
  try {
    parsed = mergeReferrerPreferFirst(parseLandingFromLocation(), cached);
  } catch {
    return cached ?? {};
  }

  const currentLanding = parsed.landing_url ?? "";
  if (cached?.landing_url && cached.landing_url === currentLanding) {
    return cached;
  }

  /**
   * sessionStorage bertahan antar navigasi dokumen penuh di tab yang sama. Tanpa cabang ini,
   * kunjungan organik lalu klik iklan (URL baru ber-UTM/gclid) tetap memakai snapshot organik.
   * Jika snapshot sudah punya atribusi tapi URL sekarang tidak (navigasi klien / SPA), pertahankan snapshot.
   */
  const cacheAttr = cached ? snapshotHasAttribution(cached) : false;
  const currAttr = snapshotHasAttribution(parsed);

  if (cacheAttr && !currAttr) {
    return cached;
  }

  if (!cacheAttr && !currAttr && cached) {
    const merged: LandingAttributionSnapshot = {
      ...cached,
      landing_url: currentLanding,
      referrer: cached.referrer?.trim() || parsed.referrer?.trim() || undefined,
    };
    try {
      sessionStorage.setItem(key, JSON.stringify(merged));
    } catch {
      // ignore quota / private mode
    }
    return merged;
  }

  const parsedForStore = mergeReferrerPreferFirst(parsed, cached);
  try {
    sessionStorage.setItem(key, JSON.stringify(parsedForStore));
  } catch {
    // ignore quota / private mode
  }
  return parsedForStore;
}

/** Subset of landing snapshot sent with lead Edge Functions (UTM + landing + referrer). */
export type LeadAttributionPayload = {
  landing_url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

/** Baca snapshot landing saat ini untuk CRM (tanpa meta_* / click-id). */
export function readLandingAttributionForLead(): LeadAttributionPayload {
  const s = readLandingAttributionOnce();
  return {
    landing_url: s.landing_url,
    referrer: s.referrer,
    utm_source: s.utm_source,
    utm_medium: s.utm_medium,
    utm_campaign: s.utm_campaign,
    utm_content: s.utm_content,
    utm_term: s.utm_term,
  };
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
      meta_campaign_name?: string;
      meta_adset_name?: string;
      meta_ad_name?: string;
      has_gclid?: boolean;
      has_fbclid?: boolean;
      has_msclkid?: boolean;
      has_gbraid?: boolean;
      has_wbraid?: boolean;
    }
  | { type: "page_view"; path: string }
  | { type: "active_ping"; path: string; delta_ms: number; scroll_max_pct?: number }
  | { type: "page_end"; path: string; scroll_max_pct?: number }
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
    // Per-tab session agar page_view/scroll tidak tercampur antar tab.
    const existing = sessionStorage.getItem(key);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
      return existing;
    }
    const id = randomUuidV4();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return randomUuidV4();
  }
}

export function resetAnalyticsSessionId(): void {
  const key = sessionStorageKey();
  try {
    // Force a new session id immediately so subsequent calls in this tick
    // won't recreate / reuse the old value.
    sessionStorage.setItem(key, randomUuidV4());
  } catch {
    /* ignore */
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
    meta_campaign_name: land.meta_campaign_name,
    meta_adset_name: land.meta_adset_name,
    meta_ad_name: land.meta_ad_name,
    has_gclid: land.has_gclid,
    has_fbclid: land.has_fbclid,
    has_msclkid: land.has_msclkid,
    has_gbraid: land.has_gbraid,
    has_wbraid: land.has_wbraid,
  };
}
