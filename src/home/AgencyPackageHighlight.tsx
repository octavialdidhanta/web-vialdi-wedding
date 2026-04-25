import { AgencyPackageCarouselStrip, type AgencyPackageKind } from "@/home/AgencyPackageCarouselStrip";

/** Kartu paket ads (scroll horizontal) — data dari Supabase `agency_packages`. */
export function AgencyPackageHighlight({ kind }: { kind: AgencyPackageKind }) {
  return <AgencyPackageCarouselStrip kind={kind} showSwipeHint />;
}

