/**
 * @deprecated Import from `@/packages/propertyPackages` — re-exports for agency UI compatibility.
 */
export {
  propertyPackageSectionZ as agencyPackageSectionZ,
  type PropertyPackageSection as AgencyPackageSection,
  type PropertyPackageRow as AgencyPackageRow,
  resolvePropertyPackageStorageUrl as resolveAgencyPackageStorageUrl,
  fetchPublishedPropertyPackages as fetchPublishedAgencyPackages,
  adminListPropertyPackages as adminListAgencyPackages,
  adminFetchPropertyPackage as adminFetchAgencyPackage,
  adminUpsertPropertyPackage as adminUpsertAgencyPackage,
  adminDeletePropertyPackage as adminDeleteAgencyPackage,
  uploadPropertyPackageMedia as uploadAgencyPackageMedia,
  isAgencyPackageWeb,
} from "@/packages/propertyPackages";

import type { PropertyPackageUpsert, PropertyPackageSection } from "@/packages/propertyPackages";

export type AgencyPackageUpsert = PropertyPackageUpsert & {
  sections: PropertyPackageSection[];
};
