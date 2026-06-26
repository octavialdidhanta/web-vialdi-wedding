import { randomUuidV4 } from "@/share/lib/randomUuid";

const VISITOR_KEY = "synckerja_visitor_id";
const SESSION_KEY = "synckerja_session_id";
/** Backup session di localStorage — tab baru / reload singkat tetap pakai session_id yang sama. */
const SESSION_BACKUP_KEY = "synckerja_session_backup_v1";
/** Sliding window inaktivitas (GA4-style) sebelum session baru. */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
/** Selaras SDK resmi Synckerja v1.4.15 — first-touch UTM per tab. */
const ATTRIBUTION_KEY = "synckerja_first_touch_attribution";

type SessionBackup = { id: string; lastActivityMs: number };

let memorySessionId: string | null = null;

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "gbraid",
  "wbraid",
] as const;

export type SynckerjaWhatsappStatus = "sent" | "delivered" | "failed" | "skipped";

export type SynckerjaWhatsappSkipReason =
  | "no_consent"
  | "no_phone"
  | "no_template"
  | "wa_not_configured"
  | "wa_account_not_mapped";

/** v1.4.15 — diagnosa mapping template / akun WA saat failed atau skipped. */
export type SynckerjaWhatsappDebug = {
  template_name?: string;
  template_language?: string;
  mapping_source?: string;
  param_count?: number;
  expected_slot_count?: number;
  web_id?: string;
  whatsapp_account_id?: string;
  phone_number_id?: string;
  account_resolution?: "mapped" | "not_mapped" | string;
};

export type SynckerjaLeadResponse = {
  success?: boolean;
  lead_id?: string;
  /** Bisa LEAD-* atau WA-* setelah konfirmasi WA terkirim (v1.4.15) */
  ticket_id?: string;
  session_id?: string;
  attribution?: Record<string, unknown>;
  whatsapp_status?: SynckerjaWhatsappStatus;
  whatsapp_message_id?: string | null;
  whatsapp_ticket_id?: string | null;
  whatsapp_conversation_id?: string | null;
  /** `meta:...` = Graph API error; `meta_precheck:...` / `meta_delivery:...` = v1.4.15 */
  whatsapp_skip_reason?: SynckerjaWhatsappSkipReason | string | null;
  whatsapp_debug?: SynckerjaWhatsappDebug | null;
  error?: string;
};

/**
 * v1.4.15 — POST /api/v1/leads body (flat JSON).
 * Reserved top-level keys (bukan `form_data`): name, phone_number, email, notes,
 * session_id, status, title, category, source_label, form_id, consent.
 * Field lain → `lead_submissions.form_data`.
 */
export type SynckerjaLeadRequest = {
  session_id?: string;
  name?: string;
  phone_number?: string;
  email?: string;
  notes?: string;
  status?: string;
  consent?: boolean;
  form_id?: string;
  /** Override CRM — default server derive dari form_data / notes / landing */
  title?: string;
  category?: string;
  source_label?: string;
  [key: string]: unknown;
};

/** Respons POST /api/v1/traffic-logs (v1.4.15 — session terverifikasi sebelum 201). */
export type SynckerjaTrafficLogResponse = {
  success?: boolean;
  session_id?: string;
  page_view_id?: string;
  visitor_id?: string;
  web_id?: string;
  error?: string;
  code?: string;
};

/** Respons POST /api/v1/wa-link-clicks (v1.4.15 — stub lead + analytics). */
export type SynckerjaWaLinkClickResponse = {
  success?: boolean;
  wa_click_id?: string;
  lead_id?: string;
  lead_created?: boolean;
  lead_sync_status?: string;
  lead_sync_error?: string | null;
  error?: string;
  code?: string;
};

export type SynckerjaClickEventResponse = {
  success?: boolean;
  error?: string;
  code?: string;
};

/** v1.4.15 — session belum siap; client boleh retry traffic-logs lalu POST ulang. */
export const SYNCKERJA_SESSION_NOT_READY = "SESSION_NOT_READY" as const;

declare global {
  interface Window {
    SynckerjaConfig?: {
      apiBase?: string;
      token?: string;
    };
    SynckerjaTrackLead?: (
      a: Record<string, unknown> | string,
      b?: string | null,
      c?: string | null,
      d?: string | null,
    ) => Promise<void>;
  }
}

function getApiBase(): string {
  const fromWindow = window.SynckerjaConfig?.apiBase?.trim();
  const fromEnv = (import.meta.env.VITE_SYNCKERJA_API_BASE as string | undefined)?.trim();
  const base = (fromWindow || fromEnv || "").replace(/\/$/, "");
  if (!base) {
    throw new Error("VITE_SYNCKERJA_API_BASE atau window.SynckerjaConfig.apiBase wajib diset");
  }
  return base;
}

function getToken(): string {
  const fromWindow = window.SynckerjaConfig?.token?.trim();
  const fromEnv = (import.meta.env.VITE_SYNCKERJA_SDK_TOKEN as string | undefined)?.trim();
  const token = fromWindow || fromEnv || "";
  if (!token) {
    throw new Error("VITE_SYNCKERJA_SDK_TOKEN atau window.SynckerjaConfig.token wajib diset");
  }
  return token;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return randomUuidV4();
}

function isValidSessionUuid(id: string | null | undefined): id is string {
  return !!id && /^[0-9a-f-]{36}$/i.test(id);
}

function readSessionBackup(): SessionBackup | null {
  try {
    const raw = localStorage.getItem(SESSION_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionBackup;
    if (!isValidSessionUuid(parsed?.id) || typeof parsed.lastActivityMs !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionBackup(id: string): void {
  try {
    const payload: SessionBackup = { id, lastActivityMs: Date.now() };
    localStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function touchSessionBackup(id: string): void {
  writeSessionBackup(id);
}

function isBackupSessionActive(backup: SessionBackup): boolean {
  return Date.now() - backup.lastActivityMs < SESSION_TIMEOUT_MS;
}

function persistSessionId(id: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, id);
  } catch {
    /* ignore */
  }
  writeSessionBackup(id);
  memorySessionId = id;
}

function resolveActiveSessionFromBackup(): string | null {
  const backup = readSessionBackup();
  if (backup && isValidSessionUuid(backup.id) && isBackupSessionActive(backup)) {
    persistSessionId(backup.id);
    return backup.id;
  }
  return null;
}

export function getSynckerjaSessionId(): string {
  if (memorySessionId && isValidSessionUuid(memorySessionId)) {
    touchSessionBackup(memorySessionId);
    try {
      if (sessionStorage.getItem(SESSION_KEY) !== memorySessionId) {
        sessionStorage.setItem(SESSION_KEY, memorySessionId);
      }
    } catch {
      /* ignore */
    }
    return memorySessionId;
  }

  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (isValidSessionUuid(existing)) {
      touchSessionBackup(existing);
      memorySessionId = existing;
      return existing;
    }
  } catch {
    /* fall through */
  }

  const fromBackup = resolveActiveSessionFromBackup();
  if (fromBackup) return fromBackup;

  const id = uuid();
  persistSessionId(id);
  return id;
}

export function getSynckerjaVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing && existing.trim().length > 0) {
      return existing.trim();
    }
    const id = uuid();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return getSynckerjaSessionId();
  }
}

export function resetSynckerjaSessionId(): void {
  const id = uuid();
  try {
    sessionStorage.setItem(SESSION_KEY, id);
    sessionStorage.removeItem(ATTRIBUTION_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(SESSION_BACKUP_KEY);
  } catch {
    /* ignore */
  }
  memorySessionId = id;
  writeSessionBackup(id);
  resetTrafficSessionBootstrap();
}

function parseAttributionFromSearch(search: string): Record<string, string> {
  const sp = new URLSearchParams(search);
  const out: Record<string, string> = {};
  for (const k of ATTRIBUTION_KEYS) {
    const v = sp.get(k);
    if (v?.trim()) out[k] = v.trim();
  }
  return out;
}

function readStoredSynckerjaAttribution(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, string> = {};
    for (const k of ATTRIBUTION_KEYS) {
      const v = (parsed as Record<string, unknown>)[k];
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    return out;
  } catch {
    return {};
  }
}

/** Persist first-touch attribution (Synckerja SDK parity). */
export function persistSynckerjaAttribution(params: Record<string, string>): void {
  if (!params || !Object.keys(params).length) return;
  try {
    const next = { ...readStoredSynckerjaAttribution() };
    for (const k of ATTRIBUTION_KEYS) {
      if (params[k]?.trim()) next[k] = params[k].trim();
    }
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * UTM + click IDs first-touch per tab (sessionStorage).
 * Server Synckerja v1.4.15 juga merge by session_id — kirim ini best practice SPA.
 */
export function getSynckerjaAttributionPayload(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const fromUrl = parseAttributionFromSearch(window.location.search);
  if (Object.keys(fromUrl).length) persistSynckerjaAttribution(fromUrl);
  return { ...readStoredSynckerjaAttribution(), ...fromUrl };
}

/** Alias for lead forms — same session as Synckerja analytics */
export function getOrCreateSessionId(): string {
  return getSynckerjaSessionId();
}

export function resetAnalyticsSessionId(): void {
  resetSynckerjaSessionId();
}

let currentPageViewId: string | null = null;
let heartbeatActiveMs = 0;
let heartbeatScrollMax = 0;
let heartbeatLastTick = Date.now();
let trafficSessionPromise: Promise<void> | null = null;

export function getCurrentPageViewId(): string | null {
  return currentPageViewId;
}

/** True jika URL atau sessionStorage punya UTM / click-id first-touch. */
export function hasSynckerjaAttribution(): boolean {
  return Object.keys(getSynckerjaAttributionPayload()).length > 0;
}

function resetTrafficSessionBootstrap(): void {
  currentPageViewId = null;
  trafficSessionPromise = null;
}

/** Bangun page_url absolut dari pathname SPA (tanpa mengandalkan window.location saat flush tertunda). */
export function buildSynckerjaPageUrl(pathname: string): string {
  const path = pathname?.trim() || "/";
  if (typeof window === "undefined") return path;
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
}

/** POST traffic-logs untuk route tertentu; selalu memperbarui currentPageViewId. */
export async function recordSynckerjaPageView(pageUrl: string): Promise<string | null> {
  return trackTrafficLog(pageUrl);
}

/**
 * Pastikan POST /traffic-logs sukses (page_view_id) sebelum click-events / wa-link-clicks (v1.4.15).
 * Hanya bootstrap sesi pertama — route change memakai recordSynckerjaPageView.
 * Returns true jika session siap.
 */
export async function ensureSynckerjaTrafficSession(pageUrl?: string): Promise<boolean> {
  if (currentPageViewId) return true;
  const href =
    pageUrl ??
    (typeof window !== "undefined" ? window.location.href : "/");
  if (!trafficSessionPromise) {
    trafficSessionPromise = trackTrafficLog(href)
      .then((pv) => {
        if (!pv) {
          resetTrafficSessionBootstrap();
        }
      })
      .finally(() => {
        if (!currentPageViewId) {
          trafficSessionPromise = null;
        }
      });
  }
  await trafficSessionPromise;
  return Boolean(currentPageViewId);
}

/** Eager traffic-logs saat mount publik (parity SDK resmi — trackPageLoad on load). */
export function bootstrapSynckerjaSessionOnMount(): void {
  if (typeof window === "undefined") return;
  void ensureSynckerjaTrafficSession();
}

/** @deprecated alias — gunakan bootstrapSynckerjaSessionOnMount */
export function bootstrapSynckerjaSessionIfAttributed(): void {
  bootstrapSynckerjaSessionOnMount();
}

function logWaLinkClickOutcome(data: SynckerjaWaLinkClickResponse, httpOk: boolean): void {
  if (!import.meta.env.DEV) return;
  if (data.code === SYNCKERJA_SESSION_NOT_READY) {
    console.warn("[synckerja] wa-link-clicks SESSION_NOT_READY — retry setelah traffic-logs");
    return;
  }
  if (!httpOk) {
    console.warn("[synckerja] wa-link-clicks failed:", data.error ?? data.code ?? "HTTP error");
    return;
  }
  if (data.lead_sync_status === "failed") {
    console.warn(
      "[synckerja] wa-link-clicks lead sync failed:",
      data.lead_sync_error ?? "(no lead_sync_error)",
    );
  }
}

function logClickEventOutcome(data: SynckerjaClickEventResponse, httpOk: boolean): void {
  if (!import.meta.env.DEV) return;
  if (data.code === SYNCKERJA_SESSION_NOT_READY) {
    console.warn("[synckerja] click-events SESSION_NOT_READY — retry setelah traffic-logs");
    return;
  }
  if (!httpOk) {
    console.warn("[synckerja] click-events failed:", data.error ?? data.code ?? "HTTP error");
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

function isSessionNotReadyResponse(data: { code?: string }): boolean {
  return data.code === SYNCKERJA_SESSION_NOT_READY;
}

async function postWithSessionRetry<T extends { code?: string }>(
  path: string,
  body: unknown,
  logOutcome: (data: T, httpOk: boolean) => void,
  bootstrapPageUrl?: string,
): Promise<{ res: Response | void; data: T }> {
  const ready = await ensureSynckerjaTrafficSession(bootstrapPageUrl);
  if (!ready) {
    return { res: undefined, data: {} as T };
  }

  let res = await synckerjaPost(path, body);
  if (!res) return { res: undefined, data: {} as T };

  let data = await parseJsonResponse<T>(res);
  if (res.status === 422 && isSessionNotReadyResponse(data)) {
    resetTrafficSessionBootstrap();
    const retryReady = await ensureSynckerjaTrafficSession(bootstrapPageUrl);
    if (!retryReady) {
      logOutcome(data, false);
      return { res, data };
    }
    res = await synckerjaPost(path, body);
    if (!res) return { res: undefined, data };
    data = await parseJsonResponse<T>(res);
  }

  logOutcome(data, res.ok);
  return { res, data };
}

async function synckerjaPost(
  path: string,
  body: unknown,
  options?: { beacon?: boolean; keepalive?: boolean },
): Promise<Response | void> {
  const url = `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const payload = JSON.stringify(body);

  /** Auth wajib Bearer — sendBeacon tidak bisa kirim header; pakai fetch keepalive saat unload. */
  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: Boolean(options?.keepalive || options?.beacon),
    });
  } catch {
    return;
  }
}

export async function trackTrafficLog(pageUrl?: string): Promise<string | null> {
  const href =
    pageUrl ??
    (typeof window !== "undefined" ? window.location.href : "/");

  getSynckerjaAttributionPayload();

  if (href && typeof window !== "undefined") {
    try {
      const fromPage = parseAttributionFromSearch(new URL(href, window.location.origin).search);
      if (Object.keys(fromPage).length) persistSynckerjaAttribution(fromPage);
    } catch {
      /* ignore invalid href */
    }
  }

  const params = getSynckerjaAttributionPayload();

  const res = await synckerjaPost("/api/v1/traffic-logs", {
    session_id: getSynckerjaSessionId(),
    visitor_id: getSynckerjaVisitorId(),
    page_url: href,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    ...params,
  });

  heartbeatActiveMs = 0;
  heartbeatScrollMax = 0;
  heartbeatLastTick = Date.now();

  if (!res || !res.ok) {
    if (import.meta.env.DEV && res && !res.ok) {
      const err = await parseJsonResponse<SynckerjaTrafficLogResponse>(res);
      console.warn("[synckerja] traffic-logs failed:", err.error ?? err.code ?? res.status);
    }
    return null;
  }

  const data = await parseJsonResponse<SynckerjaTrafficLogResponse>(res);
  if (data?.page_view_id) {
    currentPageViewId = data.page_view_id;
    return data.page_view_id;
  }

  if (import.meta.env.DEV) {
    console.warn("[synckerja] traffic-logs 201 tanpa page_view_id");
  }
  return null;
}

export function updateHeartbeatScrollMax(pct: number): void {
  heartbeatScrollMax = Math.max(heartbeatScrollMax, Math.min(100, Math.round(pct)));
}

export async function trackHeartbeat(finalize?: boolean): Promise<void> {
  if (!currentPageViewId) return;
  const now = Date.now();
  heartbeatActiveMs += Math.max(0, now - heartbeatLastTick);
  heartbeatLastTick = now;

  await synckerjaPost(
    "/api/v1/page-views/heartbeat",
    {
      page_view_id: currentPageViewId,
      active_ms: heartbeatActiveMs,
      scroll_max_pct: heartbeatScrollMax,
      ended_at: finalize ? new Date().toISOString() : null,
    },
    { beacon: finalize, keepalive: finalize },
  );
}

export async function trackClickEvent(args: {
  path: string;
  track_key: string;
  element_type: string;
  element_label: string;
  target_url?: string | null;
  is_internal?: boolean;
  page_view_id?: string | null;
}): Promise<void> {
  const bootstrapUrl = buildSynckerjaPageUrl(args.path);
  const payload: Record<string, unknown> = {
    session_id: getSynckerjaSessionId(),
    visitor_id: getSynckerjaVisitorId(),
    path: args.path || "/",
    track_key: args.track_key,
    element_type: args.element_type,
    element_label: args.element_label.slice(0, 120),
    target_url: args.target_url ?? null,
    is_internal: args.is_internal ?? false,
  };
  if (args.page_view_id) {
    payload.page_view_id = args.page_view_id;
  }
  await postWithSessionRetry<SynckerjaClickEventResponse>(
    "/api/v1/click-events",
    payload,
    logClickEventOutcome,
    bootstrapUrl,
  );
}

export async function trackWaLinkClick(args: {
  path: string;
  target_url: string;
  target_phone?: string | null;
  page_view_id?: string | null;
}): Promise<SynckerjaWaLinkClickResponse | null> {
  const bootstrapUrl = buildSynckerjaPageUrl(args.path);
  const payload: Record<string, unknown> = {
    session_id: getSynckerjaSessionId(),
    visitor_id: getSynckerjaVisitorId(),
    path: args.path || "/",
    target_url: args.target_url,
    target_phone: args.target_phone ?? null,
  };
  if (args.page_view_id) {
    payload.page_view_id = args.page_view_id;
  }
  const { data } = await postWithSessionRetry<SynckerjaWaLinkClickResponse>(
    "/api/v1/wa-link-clicks",
    payload,
    logWaLinkClickOutcome,
    bootstrapUrl,
  );
  return data;
}

export async function trackLead(body: Record<string, unknown>): Promise<SynckerjaLeadResponse> {
  const payload = { session_id: getSynckerjaSessionId(), status: "new", ...body };
  const res = await synckerjaPost("/api/v1/leads", payload);
  if (!res) {
    throw new Error("Gagal menghubungi Synckerja API (jaringan).");
  }
  let parsed: SynckerjaLeadResponse = {};
  try {
    parsed = (await res.json()) as SynckerjaLeadResponse;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      typeof parsed.error === "string" && parsed.error.trim()
        ? parsed.error.trim()
        : `Synckerja leads HTTP ${res.status}`;
    throw new Error(msg);
  }
  return parsed;
}

/** Normalisasi field lead — Meta menolak newline di variabel template WA. */
function normalizeLeadFieldValue(key: string, value: unknown): unknown {
  if (key === "event_address" && typeof value === "string") {
    return value.replace(/\r?\n+/g, " · ").replace(/\s+/g, " ").trim();
  }
  return value;
}

/** Flat lead payload — reserved keys stay top-level (v1.4.15), rest → form_data. */
export function buildLeadPayload(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = normalizeLeadFieldValue(k, v);
  }
  return out;
}

export function installSynckerjaTrackLeadGlobal(): void {
  window.SynckerjaTrackLead = (a, b, c, d) => {
    const body =
      a && typeof a === "object" && !Array.isArray(a)
        ? buildLeadPayload(a as Record<string, unknown>)
        : buildLeadPayload({
            name: a,
            phone_number: b ?? null,
            email: c ?? null,
            notes: d ?? null,
          });
    return trackLead(body).then(() => undefined);
  };
}

export function installSynckerjaConfigFromEnv(): void {
  const apiBase = (import.meta.env.VITE_SYNCKERJA_API_BASE as string | undefined)?.trim();
  const token = (import.meta.env.VITE_SYNCKERJA_SDK_TOKEN as string | undefined)?.trim();
  if (apiBase || token) {
    window.SynckerjaConfig = {
      apiBase: apiBase || window.SynckerjaConfig?.apiBase,
      token: token || window.SynckerjaConfig?.token,
    };
  }
}
