import { PackageCarouselStrip } from "@/home/PackageCarouselStrip";

/** Kartu paket (scroll horizontal) — data dari Supabase `wedding_packages`. */
export function WeddingPackageHighlight() {
  return <PackageCarouselStrip mode="home" showSwipeHint />;
}
