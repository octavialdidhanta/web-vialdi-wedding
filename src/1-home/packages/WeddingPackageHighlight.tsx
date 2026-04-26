import { PackageCarouselStrip } from "@/1-home/packages/PackageCarouselStrip";

export type WeddingPackageKind = "dokumentasi" | "rias-gaun" | "dekorasi" | "all-in-one" | "all";

/** Kartu paket (scroll horizontal) — data dari Supabase `wedding_packages`. */
export function WeddingPackageHighlight({ kind = "all" }: { kind?: WeddingPackageKind }) {
  return <PackageCarouselStrip mode="home" showSwipeHint kind={kind} />;
}
