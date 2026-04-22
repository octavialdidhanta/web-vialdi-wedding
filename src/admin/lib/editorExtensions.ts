import { tiptapDocumentExtensions } from "@/admin/lib/documentExtensions";
import { PackageCarouselWithReactNodeView } from "@/admin/extensions/packageCarouselNodeView";

/** Editor admin: NodeView React untuk pratinjau carousel di dalam dokumen. */
export const tiptapExtensions = [
  ...tiptapDocumentExtensions.filter((e) => e.name !== "packageCarousel"),
  PackageCarouselWithReactNodeView,
];
