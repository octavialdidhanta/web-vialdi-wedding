import type { AnalyticsWebId } from "@/analytics/sendAnalyticsBatch";
import {
  clearHubLeadBrowserSession,
  clearHubLeadSubmittedAt,
  readHubLeadSubmittedAt,
  readPersistedHubLeadRowId,
  writeHubLeadSubmittedAt,
  writePersistedHubLeadRowId,
} from "@/contact/hubLeadSession";

/** @deprecated Use hubLeadSession — kept for import stability. */
export const readPersistedWeddingPackageLeadRowId = readPersistedHubLeadRowId;
export const writePersistedWeddingPackageLeadRowId = writePersistedHubLeadRowId;
export const readWeddingPackageLeadSubmittedAt = readHubLeadSubmittedAt;
export const writeWeddingPackageLeadSubmittedAt = writeHubLeadSubmittedAt;
export const clearWeddingPackageLeadSubmittedAt = clearHubLeadSubmittedAt;
export const clearWeddingPackageLeadBrowserSession = clearHubLeadBrowserSession;

export type { AnalyticsWebId };
