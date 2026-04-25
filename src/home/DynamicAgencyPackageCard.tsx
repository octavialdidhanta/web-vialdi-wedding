import type { AgencyPackageRow } from "@/agency/agencyPackages";
import { PackageRadixAccordionSections } from "@/home/packageRadixAccordionSections";
import { AgencyPackagePricingCard } from "@/home/AgencyPackagePricingCard";

export function DynamicAgencyPackageCard({ pkg }: { pkg: AgencyPackageRow }) {
  return (
    <AgencyPackagePricingCard
      pkg={pkg}
      accordion={<PackageRadixAccordionSections sections={pkg.sections} />}
    />
  );
}

