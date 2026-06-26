import type { TrackKey } from "@/analytics/trackRegistry";

/** Spread both legacy `data-track` and Synckerja `data-syn-track` on interactive elements. */
export function trackSynAttrs(
  key: TrackKey,
  extra?: Record<string, string>,
): { "data-track": TrackKey; "data-syn-track": TrackKey } & Record<string, string> {
  return {
    "data-track": key,
    "data-syn-track": key,
    ...extra,
  };
}

/** WA links: v1.4.15 SDK juga auto-detect wa.me; explicit track key untuk reporting. */
export function trackSynWaAttrs(
  key: TrackKey,
  extra?: Record<string, string>,
): ReturnType<typeof trackSynAttrs> & { "data-syn-wa-track": TrackKey } {
  return {
    ...trackSynAttrs(key, extra),
    "data-syn-wa-track": key,
  };
}
