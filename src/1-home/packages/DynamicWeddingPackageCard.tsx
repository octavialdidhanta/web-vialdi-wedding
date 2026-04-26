import type { WeddingPackageRow } from "@/blog/weddingPackages";
import { PackageRadixAccordionSections } from "@/1-home/packages/packageRadixAccordionSections";
import { WeddingPackagePricingCard } from "@/1-home/packages/weddingPackagePricingCard";

export function DynamicWeddingPackageCard({ pkg }: { pkg: WeddingPackageRow }) {
  return (
    <WeddingPackagePricingCard
      pkg={pkg}
      accordion={<PackageRadixAccordionSections sections={pkg.sections} />}
    />
  );
}
