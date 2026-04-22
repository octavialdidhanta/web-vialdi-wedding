import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { PackageCarouselNode } from "@/admin/extensions/packageCarouselNode";
import { PackageConsultOpenerProvider } from "@/home/PackageConsultOpenerContext";
import { PackageCarouselStrip } from "@/home/PackageCarouselStrip";

function PackageCarouselEditorView({ node }: NodeViewProps) {
  const packageIds = (node.attrs.packageIds as string[]) ?? [];
  return (
    <NodeViewWrapper className="package-carousel-node-view my-6 w-full max-w-none">
      <PackageConsultOpenerProvider>
        <PackageCarouselStrip mode="pick" packageIds={packageIds} showSwipeHint={false} />
      </PackageConsultOpenerProvider>
    </NodeViewWrapper>
  );
}

export const PackageCarouselWithReactNodeView = PackageCarouselNode.extend({
  addNodeView() {
    return ReactNodeViewRenderer(PackageCarouselEditorView);
  },
});
