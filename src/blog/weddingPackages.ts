/**
 * @deprecated Import from `@/packages/propertyPackages` — re-exports for wedding UI compatibility.
 */
export {
  propertyPackageSectionZ as weddingPackageSectionZ,
  type PropertyPackageSection as WeddingPackageSection,
  type PropertyPackageRow as WeddingPackageRow,
  resolvePropertyPackageStorageUrl as resolvePackageStorageUrl,
  fetchPublishedPropertyPackages as fetchPublishedPackages,
  fetchPublishedPropertyPackagesByIds as fetchPublishedPackagesByIds,
  adminListPropertyPackages as adminListPackages,
  adminFetchPropertyPackage as adminFetchPackage,
  adminUpsertPropertyPackage as adminUpsertPackage,
  adminDeletePropertyPackage as adminDeletePackage,
  uploadPropertyPackageMedia as uploadPackageMedia,
} from "@/packages/propertyPackages";

import type { PropertyPackageUpsert, PropertyPackageSection } from "@/packages/propertyPackages";

export type WeddingPackageUpsert = Omit<
  PropertyPackageUpsert,
  "summary" | "spent_budget_min" | "spent_budget_max" | "spent_budget_currency" | "spent_budget_period" | "fee_percent"
> & {
  sections: PropertyPackageSection[];
};
