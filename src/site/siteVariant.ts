import { useMemo } from "react";

/** Repo ini untuk situs Vialdi Wedding. Slug analytics lama `vialdi` dipetakan ke wedding. */
export type SiteVariant = "wedding" | "unknown";

export function getSiteVariant(): SiteVariant {
  const raw = (import.meta.env.VITE_WEB_ID as string | undefined)?.trim();
  if (!raw) return "unknown";
  if (raw === "vialdi" || raw === "vialdi-wedding") return "wedding";
  return "unknown";
}

/** Tetap ada agar import lama tidak pecah; varian agensi tidak dipakai di codebase wedding. */
export function isAgencySite(): boolean {
  return false;
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
