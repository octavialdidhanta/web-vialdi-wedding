import { lazy, Suspense } from "react";
import type { JSONContent } from "@tiptap/core";
import { isPlaceholderTiptapDoc } from "@/admin/lib/isPlaceholderTiptapDoc";

const BlogPostTiptapBody = lazy(() =>
  import("@/blog/BlogPostTiptapBody").then((m) => ({ default: m.BlogPostTiptapBody })),
);

const proseArticleClass =
  "blog-post-html text-[15px] leading-[1.8] text-foreground/90 md:text-[17px] md:leading-[1.85]";

type Props = {
  bodyJson: unknown;
  bodyHtml: string;
};

/**
 * Artikel: teks dari `body_json` bila dokumen berisi (bukan placeholder), agar embed carousel interaktif;
 * selain itu memakai `bodyHtml` (artikel lama / fallback). Jalur Tiptap dimuat lazy untuk mengurangi unused JS di PSI.
 */
export function BlogPostBody({ bodyJson, bodyHtml }: Props) {
  const doc = bodyJson as JSONContent | null;
  const useJson =
    Boolean(doc?.type === "doc") && !isPlaceholderTiptapDoc(doc) && (doc?.content?.length ?? 0) > 0;

  if (!useJson) {
    return <div className={proseArticleClass} dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
  }

  return (
    <Suspense
      fallback={
        <div
          className={`${proseArticleClass} min-h-[12rem] rounded-lg border border-border bg-muted/30 animate-pulse`}
          aria-hidden
        />
      }
    >
      <BlogPostTiptapBody doc={doc!} />
    </Suspense>
  );
}
