import type { WeddingPackageRow } from "@/blog/weddingPackages";
import { PackageRadixAccordionSections } from "@/home/packageRadixAccordionSections";
import { WeddingPackagePricingCard } from "@/home/weddingPackagePricingCard";

export function DynamicWeddingPackageCard({ pkg }: { pkg: WeddingPackageRow }) {
  return (
    <WeddingPackagePricingCard
      pkg={pkg}
      accordion={<PackageRadixAccordionSections sections={pkg.sections} />}
    />
  );
}
