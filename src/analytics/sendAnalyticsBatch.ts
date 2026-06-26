import {
  bootstrapSynckerjaSessionOnMount,
  buildSynckerjaPageUrl,
  ensureSynckerjaTrafficSession,
  getOrCreateSessionId,
  getSynckerjaAttributionPayload,
  getSynckerjaVisitorId,
  persistSynckerjaAttribution,
  recordSynckerjaPageView,
  resetAnalyticsSessionId,
  trackClickEvent,
  trackHeartbeat,
  trackWaLinkClick,
  updateHeartbeatScrollMax,
} from "@/analytics/synckerjaApi";
import { getRequiredCmsPropertySlug, type AnalyticsWebId } from "@/share/cmsPropertySlug";

export type { AnalyticsWebId };
export { getOrCreateSessionId, resetAnalyticsSessionId };

/** CMS property slug (posts/packages). Synckerja web_id is bound to the SDK token. */
export function getRequiredWebId(): AnalyticsWebId {
  return getRequiredCmsPropertySlug();
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
  /** Google Click ID value from `?gclid=` (first-touch per tab in sessionStorage). */
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  gbraid?: string;
  wbraid?: string;
  has_gclid?: boolean;
  has_fbclid?: boolean;
  has_msclkid?: boolean;
  has_gbraid?: boolean;
  has_wbraid?: boolean;
};

/** Panggil di mount layout publik — eager traffic-logs (parity SDK v1.4.15). */
export function ensureLandingAttributionCaptured(): void {
  readLandingAttributionOnce();
  bootstrapSynckerjaSessionOnMount();
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
      s.gclid ||
      s.fbclid ||
      s.msclkid ||
      s.gbraid ||
      s.wbraid ||
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
  const getParam = (name: string): string | null => {
    // URLSearchParams is case-sensitive; ads/redirect tools sometimes send UTM in uppercase.
    const v =
      sp.get(name) ??
      sp.get(name.toLowerCase()) ??
      sp.get(name.toUpperCase()) ??
      sp.get(
        name
          .toLowerCase()
          .split("_")
          .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
          .join("_"),
      );
    return v;
  };
  const q = (name: string) => {
    const v = getParam(name);
    return v != null && v.trim() !== "" ? clip(v.trim(), MAX_UTM_FIELD) : undefined;
  };
  const hasNonEmptyParam = (name: string) => {
    const v = getParam(name);
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
    gclid: q("gclid"),
    fbclid: q("fbclid"),
    msclkid: q("msclkid"),
    gbraid: q("gbraid"),
    wbraid: q("wbraid"),
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

function syncSnapshotToSynckerjaAttribution(s: LandingAttributionSnapshot): void {
  const params: Record<string, string> = {};
  if (s.utm_source) params.utm_source = s.utm_source;
  if (s.utm_medium) params.utm_medium = s.utm_medium;
  if (s.utm_campaign) params.utm_campaign = s.utm_campaign;
  if (s.utm_content) params.utm_content = s.utm_content;
  if (s.utm_term) params.utm_term = s.utm_term;
  if (s.gclid) params.gclid = s.gclid;
  if (s.fbclid) params.fbclid = s.fbclid;
  if (s.msclkid) params.msclkid = s.msclkid;
  if (s.gbraid) params.gbraid = s.gbraid;
  if (s.wbraid) params.wbraid = s.wbraid;
  persistSynckerjaAttribution(params);
}

export function readLandingAttributionOnce(): LandingAttributionSnapshot {
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
    syncSnapshotToSynckerjaAttribution(cached);
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
    syncSnapshotToSynckerjaAttribution(cached!);
    return cached!;
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
    syncSnapshotToSynckerjaAttribution(merged);
    return merged;
  }

  const parsedForStore = mergeReferrerPreferFirst(parsed, cached);
  if (cached?.gclid?.trim()) {
    parsedForStore.gclid = cached.gclid;
    parsedForStore.has_gclid = true;
  }
  if (cached?.fbclid?.trim()) {
    parsedForStore.fbclid = cached.fbclid;
    parsedForStore.has_fbclid = true;
  }
  if (cached?.msclkid?.trim()) {
    parsedForStore.msclkid = cached.msclkid;
    parsedForStore.has_msclkid = true;
  }
  if (cached?.gbraid?.trim()) {
    parsedForStore.gbraid = cached.gbraid;
    parsedForStore.has_gbraid = true;
  }
  if (cached?.wbraid?.trim()) {
    parsedForStore.wbraid = cached.wbraid;
    parsedForStore.has_wbraid = true;
  }
  try {
    sessionStorage.setItem(key, JSON.stringify(parsedForStore));
  } catch {
    // ignore quota / private mode
  }
  syncSnapshotToSynckerjaAttribution(parsedForStore);
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
  gclid?: string;
};

/** Baca snapshot landing saat ini untuk CRM / lead (Synckerja merge via session_id). */
export function readLandingAttributionForLead(): LeadAttributionPayload {
  const s = readLandingAttributionOnce();
  const syn = getSynckerjaAttributionPayload();
  return {
    landing_url: s.landing_url,
    referrer: s.referrer,
    utm_source: syn.utm_source ?? s.utm_source,
    utm_medium: syn.utm_medium ?? s.utm_medium,
    utm_campaign: syn.utm_campaign ?? s.utm_campaign,
    utm_content: syn.utm_content ?? s.utm_content,
    utm_term: syn.utm_term ?? s.utm_term,
    gclid: syn.gclid ?? s.gclid,
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
      gclid?: string;
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
      page_view_id?: string | null;
      track_key?: string | null;
      element_type: string;
      element_label: string;
      target_url?: string | null;
      is_internal?: boolean;
    };

type ClickEvent = Extract<IngestEvent, { type: "click" }>;

const CLICK_BUFFER_MAX = 25;
const CLICK_BUFFER_FLUSH_DEFER_MS = 250;

let pendingClicks: ClickEvent[] = [];
let clickFlushTimer: number | null = null;
let clickListenersInstalled = false;

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

export function getOrCreateVisitorId(): string {
  return getSynckerjaVisitorId();
}

function simpleUaHash(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  let h = 0;
  for (let i = 0; i < ua.length; i++) {
    h = (Math.imul(31, h) + ua.charCodeAt(i)) | 0;
  }
  return String(h);
}

function isClickEvent(ev: IngestEvent): ev is ClickEvent {
  return Boolean(ev && typeof ev === "object" && "type" in ev && ev.type === "click");
}

async function dispatchSynckerjaEvents(events: IngestEvent[], opts?: { keepalive?: boolean }) {
  for (const ev of events) {
    if (ev.type === "page_view") {
      await recordSynckerjaPageView(buildSynckerjaPageUrl(ev.path));
    }
  }

  for (const ev of events) {
    if (ev.type === "session_touch" || ev.type === "page_view") {
      continue;
    }
    if (ev.type === "active_ping" || ev.type === "page_end") {
      if (typeof ev.scroll_max_pct === "number") {
        updateHeartbeatScrollMax(ev.scroll_max_pct);
      }
      await trackHeartbeat(ev.type === "page_end" || opts?.keepalive);
      continue;
    }
    if (ev.type === "click") {
      if (!ev.page_view_id) {
        await ensureSynckerjaTrafficSession(buildSynckerjaPageUrl(ev.path));
      }
      await trackClickEvent({
        path: ev.path,
        track_key: ev.track_key || "unknown",
        element_type: ev.element_type,
        element_label: ev.element_label,
        target_url: ev.target_url,
        is_internal: ev.is_internal,
        page_view_id: ev.page_view_id,
      });
    }
  }
}

function clearClickFlushTimer() {
  if (clickFlushTimer != null) {
    window.clearTimeout(clickFlushTimer);
    clickFlushTimer = null;
  }
}

export async function flushPendingClicks(opts?: { keepalive?: boolean }): Promise<void> {
  if (typeof window === "undefined") {
    pendingClicks = [];
    return;
  }
  if (pendingClicks.length === 0) {
    clearClickFlushTimer();
    return;
  }

  const batch = pendingClicks.slice(0, CLICK_BUFFER_MAX);
  pendingClicks = pendingClicks.slice(batch.length);

  clearClickFlushTimer();

  try {
    await dispatchSynckerjaEvents(batch, { keepalive: opts?.keepalive });
  } catch (e) {
    // Never throw in analytics; keep pending to retry on next flush opportunity.
    pendingClicks = batch.concat(pendingClicks);
    console.warn("[analytics] click flush failed", e);
  }
}

function scheduleClickFlushIdle() {
  if (typeof window === "undefined") return;
  if (clickFlushTimer != null) return;
  clickFlushTimer = window.setTimeout(() => {
    clickFlushTimer = null;
    void flushPendingClicks();
  }, CLICK_BUFFER_FLUSH_DEFER_MS);
}

function ensureClickFlushListenersInstalled() {
  if (clickListenersInstalled) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  clickListenersInstalled = true;

  const onVis = () => {
    if (document.visibilityState === "hidden") {
      // Tab is being backgrounded (new tab opened, app switched, etc.).
      void flushPendingClicks({ keepalive: true });
    }
  };
  const onPageHide = () => {
    // Most reliable signal for page lifecycle end.
    void flushPendingClicks({ keepalive: true });
  };

  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", onPageHide);
}

export async function sendAnalyticsBatch(
  events: IngestEvent[],
  options?: {
    useBeacon?: boolean;
    keepalive?: boolean;
    /** Jangan tunggu respons fetch di task saat ini (memutus tautan kritis Lighthouse). */
    deferNetwork?: boolean;
    /** Setelah `load`, tunggu dulu (ms) sebelum rantai rAF/idle — dipakai page_view awal. */
    deferNetworkLeadMs?: number;
  },
): Promise<void> {
  if (events.length === 0) {
    return;
  }

  // Click-only reliability: when the tab becomes hidden (e.g. open link in new tab),
  // browsers often throttle idle callbacks/timers. Buffer click events and flush them
  // on lifecycle signals (visibilitychange/pagehide) with keepalive.
  const allClicks = events.every(isClickEvent);
  if (allClicks && options?.deferNetwork) {
    ensureClickFlushListenersInstalled();
    pendingClicks = pendingClicks.concat(events as ClickEvent[]);
    if (pendingClicks.length >= CLICK_BUFFER_MAX) {
      // If buffer grows, attempt an early flush (best effort).
      void flushPendingClicks({ keepalive: true });
    } else {
      scheduleClickFlushIdle();
    }
    return;
  }

  const useKeepalive = Boolean(options?.useBeacon) || Boolean(options?.keepalive);

  const runFetch = async () => {
    await dispatchSynckerjaEvents(events, { keepalive: useKeepalive });
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
    gclid: land.gclid,
    has_gclid: land.has_gclid,
    has_fbclid: land.has_fbclid,
    has_msclkid: land.has_msclkid,
    has_gbraid: land.has_gbraid,
    has_wbraid: land.has_wbraid,
  };
}
