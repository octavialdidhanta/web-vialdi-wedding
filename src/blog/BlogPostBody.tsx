import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { tiptapDocumentExtensions } from "@/admin/lib/documentExtensions";
import { isPlaceholderTiptapDoc } from "@/admin/lib/htmlToTiptapDoc";
import { PackageConsultOpenerProvider } from "@/home/PackageConsultOpenerContext";
import { PackageCarouselStrip } from "@/home/PackageCarouselStrip";

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

type Props = {
  bodyJson: unknown;
  bodyHtml: string;
};

/**
 * Artikel: teks dari `body_json` bila dokumen berisi (bukan placeholder), agar embed carousel interaktif;
 * selain itu memakai `bodyHtml` (artikel lama / fallback).
 */
export function BlogPostBody({ bodyJson, bodyHtml }: Props) {
  const doc = bodyJson as JSONContent | null;
  const useJson =
    Boolean(doc?.type === "doc") && !isPlaceholderTiptapDoc(doc) && (doc?.content?.length ?? 0) > 0;

  if (!useJson) {
    return <div className={proseArticleClass} dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
  }

  const segments = splitDocByCarousel(doc!);

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
              <PackageCarouselStrip mode="pick" packageIds={seg.packageIds} showSwipeHint />
            </div>
          );
        })}
      </div>
    </PackageConsultOpenerProvider>
  );
}
