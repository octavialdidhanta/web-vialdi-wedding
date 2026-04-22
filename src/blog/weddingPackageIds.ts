/** UUID seed — harus sama dengan `supabase/migrations/20260422100100_wedding_packages_seed.sql`. */
export const LEGACY_PACKAGE_SLUG_TO_UUID: Record<string, string> = {
  royal_wedding_gold: "11111111-1111-4111-8111-000000000001",
  wedding_gold_premium: "11111111-1111-4111-8111-000000000002",
  wedding_super_junior: "11111111-1111-4111-8111-000000000003",
  royal_platinum_foto_only: "11111111-1111-4111-8111-000000000004",
  wedding_platinum_album: "11111111-1111-4111-8111-000000000005",
  wedding_junior: "11111111-1111-4111-8111-000000000006",
  akad_nikah_spesial: "11111111-1111-4111-8111-000000000007",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isProbablyPackageUuid(id: string): boolean {
  return UUID_RE.test(id.trim());
}

/** Embed blog lama memakai slug katalog; normalisasi ke UUID seed. */
export function normalizeCarouselPackageIds(ids: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = raw.trim();
    if (!id) continue;
    const resolved = LEGACY_PACKAGE_SLUG_TO_UUID[id] ?? (isProbablyPackageUuid(id) ? id : null);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    out.push(resolved);
  }
  return out;
}
