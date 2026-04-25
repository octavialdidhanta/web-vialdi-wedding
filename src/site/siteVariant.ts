import { useMemo } from "react";

export type SiteVariant = "agency" | "wedding" | "unknown";

export function getSiteVariant(): SiteVariant {
  const raw = (import.meta.env.VITE_WEB_ID as string | undefined)?.trim();
  if (!raw) return "unknown";
  if (raw === "vialdi") return "agency";
  if (raw === "vialdi-wedding") return "wedding";
  return "unknown";
}

export function isAgencySite(): boolean {
  return getSiteVariant() === "agency";
}

export function isWeddingSite(): boolean {
  return getSiteVariant() === "wedding";
}

export function useIsAgencySite(): boolean {
  return useMemo(() => isAgencySite(), []);
}

export function useIsWeddingSite(): boolean {
  return useMemo(() => isWeddingSite(), []);
}

