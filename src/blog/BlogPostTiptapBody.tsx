import { lazy, Suspense } from "react";
import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { tiptapDocumentExtensions } from "@/admin/lib/documentExtensions";
import { PackageConsultOpenerProvider } from "@/home/PackageConsultOpenerContext";

const PackageCarouselStrip = lazy(() =>
  import("@/home/PackageCarouselStrip").then((m) => ({ default: m.PackageCarouselStrip })),
);

const proseArticleClass =
  "blog-post-html text-[15px] leading-[1.8] text-foreground/90 md:text-[17px] md:leading-[1.85]";

type Segment = { kind: "html"; nodes: JSONContent[] } | { kind: "carousel"; packageIds: string[] };

function splitDocByCarousel(doc: JSONContent): Segment[] {
  const content = doc.content ?? [];
  const out: Segment[] = [];
  let htmlNodes: JSONContent[] = [];

  const flushHtml = () => {
    if (htmlNodes.length === 0) {
      return;
    }
    out.push({ kind: "html", nodes: htmlNodes });
    htmlNodes = [];
  };

  for (const node of content) {
    if (node.type === "packageCarousel") {
      flushHtml();
      const ids = (node.attrs?.packageIds as string[] | undefined) ?? [];
      out.push({ kind: "carousel", packageIds: ids });
    } else {
      htmlNodes.push(node);
    }
  }
  flushHtml();
  return out;
}

type Props = { doc: JSONContent };

/**
 * Render artikel dari `body_json` + embed carousel — chunk terpisah agar artikel HTML-only tidak memuat Tiptap/ProseMirror.
 */
export function BlogPostTiptapBody({ doc }: Props) {
  const segments = splitDocByCarousel(doc);

  return (
    <PackageConsultOpenerProvider>
      <div className={proseArticleClass}>
        {segments.map((seg, i) => {
          if (seg.kind === "html") {
            if (seg.nodes.length === 0) {
              return null;
            }
            const html = generateHTML(
              { type: "doc", content: seg.nodes },
              tiptapDocumentExtensions,
            );
            return (
              <div
                key={`html-${i}`}
                className="blog-post-html-chunk"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          return (
            <div key={`carousel-${i}`} className="my-6">
              <Suspense
                fallback={
                  <div
                    className="h-40 w-full animate-pulse rounded-xl border border-border bg-muted/60"
                    aria-hidden
                  />
                }
              >
                <PackageCarouselStrip mode="pick" packageIds={seg.packageIds} showSwipeHint />
              </Suspense>
            </div>
          );
        })}
      </div>
    </PackageConsultOpenerProvider>
  );
}
