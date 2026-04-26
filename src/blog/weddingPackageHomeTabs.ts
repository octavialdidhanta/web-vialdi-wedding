/**
 * Label "pill" di admin & tab "Paket unggulan" di beranda — harus sama persis
 * agar paket hanya tampil di tab yang dipilih.
 */
export const WEDDING_HOME_BADGE_PILL_OPTIONS = [
  "Dokumentasi",
  "Rias & Gaun",
  "Dekorasi",
  "Paket All in one",
] as const;

export type WeddingHomeBadgePill = (typeof WEDDING_HOME_BADGE_PILL_OPTIONS)[number];

function normLabel(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Tab carousel beranda (tanpa "all"). */
export type WeddingCarouselTabKind = "dokumentasi" | "rias-gaun" | "dekorasi" | "all-in-one";

const BADGE_TO_TAB: Record<string, WeddingCarouselTabKind> = {
  [normLabel("Dokumentasi")]: "dokumentasi",
  [normLabel("Rias & Gaun")]: "rias-gaun",
  [normLabel("Dekorasi")]: "dekorasi",
  [normLabel("Paket All in one")]: "all-in-one",
};

/**
 * Jika `badge_label` salah satu empat pill resmi, kembalikan tab-nya.
 * Selain itu `null` → filter pakai heuristik legacy (judul / label lama).
 */
export function homeBadgePillToCarouselKind(badgeLabel: string): WeddingCarouselTabKind | null {
  const k = normLabel(badgeLabel);
  return BADGE_TO_TAB[k] ?? null;
}
