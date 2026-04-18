import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import type { BlogPostPublic } from "@/blog/types";
import { postAccentClass } from "@/blog/postAccentClass";
import { cn } from "@/share/lib/utils";

export function PostCard({
  post,
  layout = "default",
}: {
  post: BlogPostPublic;
  layout?: "default" | "compact";
}) {
  const compact = layout === "compact";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]",
        compact && "md:flex md:flex-row",
      )}
    >
      <Link
        to={`/blog/${post.slug}`}
        className={cn(
          "group flex h-full min-h-0 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-orange/50 focus-visible:ring-offset-2",
          compact && "md:flex-row",
        )}
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-gradient-to-br",
            postAccentClass(post.accent),
            compact
              ? "aspect-[16/10] md:aspect-auto md:w-[38%] md:min-h-[140px]"
              : "aspect-[16/9] sm:aspect-[5/2]",
          )}
        >
          <img
            src={post.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 md:bottom-2.5 md:left-2.5">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-navy shadow-sm md:text-[10px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className={cn("flex min-w-0 flex-1 flex-col p-4 sm:p-4", compact && "md:py-4")}>
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
