import type { AnalyticsWebId } from "@/analytics/sendAnalyticsBatch";

const ROW_KEY = "vialdi_wpkg_lead_row_v1";
const SUBMITTED_AT_KEY = "vialdi_wpkg_lead_submitted_at_v1";
/** @deprecated Dibersihkan saat `clearWeddingPackageLeadBrowserSession` untuk migrasi dari build lama. */
const LEGACY_AUTOSAVE_ONCE_KEY = "vialdi_wpkg_autosave_once_v1";

function rowStorageKey(webId: AnalyticsWebId): string {
  return `${ROW_KEY}_${webId}`;
}

function submittedAtStorageKey(webId: AnalyticsWebId): string {
  return `${SUBMITTED_AT_KEY}_${webId}`;
}

function isUuidLike(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());
}

/** `leads_vialdi_wedding.id` untuk tab ini — satu baris per tab, semua kartu paket UPDATE baris yang sama. */
export function readPersistedWeddingPackageLeadRowId(webId: AnalyticsWebId): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(rowStorageKey(webId))?.trim();
    if (!raw || !isUuidLike(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function writePersistedWeddingPackageLeadRowId(webId: AnalyticsWebId, id: string): void {
  if (typeof sessionStorage === "undefined") return;
  const t = id.trim();
  if (!isUuidLike(t)) return;
  try {
    sessionStorage.setItem(rowStorageKey(webId), t);
  } catch {
    /* quota / private mode */
  }
}

export function readWeddingPackageLeadSubmittedAt(webId: AnalyticsWebId): number | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(submittedAtStorageKey(webId))?.trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
}

export function writeWeddingPackageLeadSubmittedAt(webId: AnalyticsWebId, submittedAtMs: number): void {
  if (typeof sessionStorage === "undefined") return;
  if (!Number.isFinite(submittedAtMs) || submittedAtMs <= 0) return;
  try {
    sessionStorage.setItem(submittedAtStorageKey(webId), String(Math.floor(submittedAtMs)));
  } catch {
    /* ignore */
  }
}

export function clearWeddingPackageLeadSubmittedAt(webId: AnalyticsWebId): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(submittedAtStorageKey(webId));
  } catch {
    /* ignore */
  }
}

/** Setelah lead selesai (step 2); konsultasi berikutnya di tab yang sama boleh INSERT baru. */
export function clearWeddingPackageLeadBrowserSession(webId: AnalyticsWebId): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(rowStorageKey(webId));
    sessionStorage.removeItem(submittedAtStorageKey(webId));
    sessionStorage.removeItem(`${LEGACY_AUTOSAVE_ONCE_KEY}_${webId}`);
  } catch {
    /* ignore */
  }
}
