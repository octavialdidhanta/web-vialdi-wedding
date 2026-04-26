import type { WeddingPackageRow } from "@/blog/weddingPackages";
import { WeddingPackageLightweightSections } from "@/1-home/packages/weddingPackageCardLightweightSections";
import { WeddingPackagePricingCard } from "@/1-home/packages/weddingPackagePricingCard";

/** Kartu paket untuk embed (blog / admin): tanpa Radix Accordion — chunk lebih ringan. */
export function DynamicWeddingPackageCardEmbed({ pkg }: { pkg: WeddingPackageRow }) {
  return (
    <WeddingPackagePricingCard
      pkg={pkg}
      accordion={<WeddingPackageLightweightSections sections={pkg.sections} />}
    />
  );
}
