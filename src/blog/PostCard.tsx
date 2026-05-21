import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { getBlogCardCoverImgProps } from "@/blog/blogCoverImageUrls";
import { blogPostPath } from "@/blog/blogSlugFromLocation";
import { prefetchBlogPostDetail } from "@/blog/prefetchBlogPostDetail";
import type { BlogPostPublic } from "@/blog/types";
import { postAccentClass } from "@/blog/postAccentClass";
import { cn } from "@/share/lib/utils";
import { useCallback, useMemo } from "react";

function TagPills({ tags, compact }: { tags: string[]; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span
          key={t}
          className={cn(
            "rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-navy shadow-sm md:text-[10px]",
            compact && "px-1.5 py-0.5 text-[8px] md:text-[9px]",
          )}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function PostCard({
  post,
  layout = "default",
  priority = false,
}: {
  post: BlogPostPublic;
  /** `list` = baris horizontal (gambar kiri) untuk indeks /blog. */
  layout?: "default" | "compact" | "list";
  /** Untuk kartu LCP (mis. pilihan editor): muat gambar segera, hindari lazy. */
  priority?: boolean;
}) {
  const isList = layout === "list";
  const compact = layout === "compact";
  const queryClient = useQueryClient();
  const warmDetail = useCallback(() => {
    prefetchBlogPostDetail(queryClient, post.slug);
  }, [queryClient, post.slug]);
  const hasCover = Boolean(post.coverImage?.trim());
  const coverImg = useMemo(
    () =>
      !hasCover
        ? { src: "", sizes: "1px" as const }
        : isList
          ? getBlogCardCoverImgProps(post.coverImage, { list: true, featured: priority })
          : getBlogCardCoverImgProps(post.coverImage, { featured: priority }),
    [post.coverImage, priority, isList, hasCover],
  );

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]",
        compact && !isList && "md:flex md:flex-row",
      )}
    >
      <Link
        to={blogPostPath(post.slug)}
        onMouseEnter={warmDetail}
        onFocus={warmDetail}
        onTouchStart={warmDetail}
        className={cn(
          "group flex h-full min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-orange/50 focus-visible:ring-offset-2",
          hasCover && isList && "flex-col items-stretch md:flex-row md:items-center",
          !hasCover && isList && "flex-col",
          !isList && "flex-col",
          compact && !isList && "md:flex-row",
        )}
      >
        {hasCover ? (
          <div
            className={cn(
              "relative isolate shrink-0 overflow-hidden",
              !isList && "flex w-full justify-center",
              isList
                ? cn(
                    "shrink-0 overflow-hidden bg-muted",
                    "aspect-square w-full border-b border-border/70 md:w-44 md:shrink-0 md:border-b-0 md:border-r",
                    priority && "md:w-48",
                  )
                : cn("w-full bg-gradient-to-br", postAccentClass(post.accent)),
              !isList &&
                compact &&
                "md:flex md:min-h-[11rem] md:w-[38%] md:max-w-sm md:self-stretch md:items-center md:justify-center",
            )}
          >
            <img
              src={coverImg.src}
              srcSet={coverImg.srcSet}
              sizes={coverImg.sizes}
              alt={post.title}
              className={cn(
                "z-0 transition-transform duration-300 group-hover:scale-[1.02]",
                isList && "absolute inset-0 h-full w-full object-cover object-center",
                !isList &&
                  "relative object-contain h-auto w-auto max-w-full max-h-[min(52vh,440px)] sm:max-h-[min(56vh,480px)]",
                !isList && priority && "max-h-[min(58vh,520px)] sm:max-h-[min(62vh,560px)]",
                !isList && compact && "md:max-h-[min(72vh,560px)]",
              )}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "low"}
            />
            {!isList ? (
              <>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
                <div className="absolute bottom-2 left-2 right-2 z-[1] flex flex-wrap gap-1 md:bottom-2.5 md:left-2.5">
                  <TagPills tags={post.tags} />
                </div>
              </>
            ) : post.tags.length > 0 ? (
              <>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-80 transition-opacity group-hover:opacity-90 md:hidden" />
                <div className="absolute bottom-2 left-2 right-2 z-[1] flex flex-wrap gap-1 md:bottom-2.5 md:left-2.5 md:hidden">
                  <TagPills tags={post.tags} />
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col p-4 sm:p-4",
            isList && "p-4 md:py-3 md:pl-3 md:pr-4",
            compact && !isList && "md:py-4",
          )}
        >
          <time className="text-xs font-medium text-muted-foreground" dateTime={post.date}>
            {new Date(post.date + "T12:00:00").toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          <h2 className="mt-1.5 text-base font-bold leading-snug tracking-tight text-navy transition-colors group-hover:text-accent-orange md:text-lg">
            {post.title}
          </h2>
          {isList && post.tags.length > 0 ? (
            <div className="mt-2 hidden md:block">
              <TagPills tags={post.tags} compact />
            </div>
          ) : null}
          <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground md:line-clamp-3 md:text-sm">
            {post.excerpt}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground md:text-xs">
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              {post.readTimeMinutes} menit baca
            </span>
            <span className="text-xs font-semibold text-accent-orange transition-colors group-hover:underline md:text-sm">
              Baca artikel →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
