import type { WeddingPackageRow } from "@/blog/weddingPackages";
import { WeddingPackageLightweightSections } from "@/home/weddingPackageCardLightweightSections";
import { WeddingPackagePricingCard } from "@/home/weddingPackagePricingCard";

/** Kartu paket untuk embed (blog / admin): tanpa Radix Accordion — chunk lebih ringan. */
export function DynamicWeddingPackageCardEmbed({ pkg }: { pkg: WeddingPackageRow }) {
  return (
    <WeddingPackagePricingCard
      pkg={pkg}
      accordion={<WeddingPackageLightweightSections sections={pkg.sections} />}
    />
  );
}
