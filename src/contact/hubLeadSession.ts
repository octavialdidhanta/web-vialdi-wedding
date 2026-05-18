import type { AnalyticsWebId } from "@/analytics/sendAnalyticsBatch";

export const HUB_CONTACT_FORM_ID = "contact-main";

export function leadSessionStorageKey(webId: string, formId: string): string {
  return `lead_session_${webId}_${formId}`;
}

const LEGACY_ROW_KEY = "vialdi_wpkg_lead_row_v1";
const LEGACY_SUBMITTED_AT_KEY = "vialdi_wpkg_lead_submitted_at_v1";

function isUuidLike(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());
}

function rowKey(webId: AnalyticsWebId): string {
  return leadSessionStorageKey(webId, HUB_CONTACT_FORM_ID);
}

function submittedAtKey(webId: AnalyticsWebId): string {
  return `${leadSessionStorageKey(webId, HUB_CONTACT_FORM_ID)}_submitted_at`;
}

/** `lead_submissions.id` for this tab — one draft row per analytics session. */
export function readPersistedHubLeadRowId(webId: AnalyticsWebId): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const hub = sessionStorage.getItem(rowKey(webId))?.trim();
    if (hub && isUuidLike(hub)) return hub;
    const legacy = sessionStorage.getItem(`${LEGACY_ROW_KEY}_${webId}`)?.trim();
    if (legacy && isUuidLike(legacy)) {
      sessionStorage.setItem(rowKey(webId), legacy);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export function writePersistedHubLeadRowId(webId: AnalyticsWebId, id: string): void {
  if (typeof sessionStorage === "undefined") return;
  const t = id.trim();
  if (!isUuidLike(t)) return;
  try {
    sessionStorage.setItem(rowKey(webId), t);
    sessionStorage.setItem(`${LEGACY_ROW_KEY}_${webId}`, t);
  } catch {
    /* quota */
  }
}

export function readHubLeadSubmittedAt(webId: AnalyticsWebId): number | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(submittedAtKey(webId))?.trim() ||
      sessionStorage.getItem(`${LEGACY_SUBMITTED_AT_KEY}_${webId}`)?.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
}

export function writeHubLeadSubmittedAt(webId: AnalyticsWebId, submittedAtMs: number): void {
  if (typeof sessionStorage === "undefined") return;
  if (!Number.isFinite(submittedAtMs) || submittedAtMs <= 0) return;
  try {
    const s = String(Math.floor(submittedAtMs));
    sessionStorage.setItem(submittedAtKey(webId), s);
    sessionStorage.setItem(`${LEGACY_SUBMITTED_AT_KEY}_${webId}`, s);
  } catch {
    /* ignore */
  }
}

export function clearHubLeadSubmittedAt(webId: AnalyticsWebId): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(submittedAtKey(webId));
    sessionStorage.removeItem(`${LEGACY_SUBMITTED_AT_KEY}_${webId}`);
  } catch {
    /* ignore */
  }
}

/** After final submit; next consult in same tab may start a new draft. */
export function clearHubLeadBrowserSession(webId: AnalyticsWebId): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(rowKey(webId));
    sessionStorage.removeItem(submittedAtKey(webId));
    sessionStorage.removeItem(`${LEGACY_ROW_KEY}_${webId}`);
    sessionStorage.removeItem(`${LEGACY_SUBMITTED_AT_KEY}_${webId}`);
    sessionStorage.removeItem(`vialdi_wpkg_autosave_once_v1_${webId}`);
  } catch {
    /* ignore */
  }
}
