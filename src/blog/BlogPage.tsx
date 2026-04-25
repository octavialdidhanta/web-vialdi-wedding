import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { Search, Sparkles } from "lucide-react";
import {
  blogCta,
  blogEmpty,
  blogFeatured,
  blogHero,
  blogIndexSeo,
  blogList,
  blogSearch,
} from "@/blog/content";
import { PostCard } from "@/blog/PostCard";
import { getAllTagsFromPosts, getFeaturedPost } from "@/blog/agencySupabaseBlog";
import { usePublishedPostsQuery } from "@/blog/useBlogQueries";
import { useBlogMeta } from "@/blog/useBlogMeta";
import { Footer } from "@/share/Footer";
import { Header } from "@/share/Header";
import { Input } from "@/share/ui/input";
import { Skeleton } from "@/share/ui/skeleton";
import { cn } from "@/share/lib/utils";

export function BlogPage() {
  useBlogMeta(blogIndexSeo.title, blogIndexSeo.description);

  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const { data: blogPosts = [], isLoading, error } = usePublishedPostsQuery();

  const tags = useMemo(() => getAllTagsFromPosts(blogPosts), [blogPosts]);
  const featured = useMemo(() => getFeaturedPost(blogPosts), [blogPosts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogPosts.filter((p) => {
      const tagOk = !activeTag || p.tags.includes(activeTag);
      if (!q) {
        return tagOk;
      }
      const blob = `${p.title} ${p.excerpt} ${p.tags.join(" ")}`.toLowerCase();
      return tagOk && blob.includes(q);
    });
  }, [query, activeTag, blogPosts]);

  const listPosts = useMemo(() => {
    if (!featured) {
      return filtered;
    }
    return filtered.filter((p) => p.slug !== featured.slug);
  }, [filtered, featured]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-destructive md:px-6">
          {(error as Error).message}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-x-hidden border-b border-border/40 bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-accent-orange/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="relative mx-auto max-w-[90rem] px-4 py-8 md:px-6 md:py-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy shadow-sm">
            <Sparkles className="h-3 w-3 text-accent-orange" aria-hidden />
            {blogHero.eyebrow}
          </div>
          <h1 className="mt-4 max-w-3xl text-2xl font-bold leading-snug tracking-tight text-navy md:text-3xl lg:text-4xl">
            {blogHero.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {blogHero.subtitle}
          </p>
        </div>
      </section>

      <section className="sticky top-16 z-40 border-b border-border/60 bg-background/95 py-2.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-2.5 px-4 md:flex-row md:items-center md:justify-between md:gap-5 md:px-6">
          <div className="relative min-w-0 max-w-xl flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder={blogSearch.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 rounded-lg border-border bg-card pl-9 pr-3 text-sm shadow-sm"
              aria-label={blogSearch.ariaLabel}
            />
          </div>
          <div className="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto scroll-px-4 px-1 pb-0.5 md:max-w-[50%] md:scroll-px-6 md:px-2">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors md:text-xs",
                activeTag === null
                  ? "border-accent-orange bg-accent-orange/15 text-accent-orange"
                  : "border-border bg-card text-navy hover:border-accent-orange/50",
              )}
            >
              Semua topik
            </button>
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTag((cur) => (cur === t ? null : t))}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors md:text-xs",
                  activeTag === t
                    ? "border-accent-orange bg-accent-orange/15 text-accent-orange"
                    : "border-border bg-card text-navy hover:border-accent-orange/50",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-[90rem] px-4 pt-1 md:px-6">
          <p className="text-[11px] text-muted-foreground md:text-xs">
            Menampilkan{" "}
            <span className="font-semibold text-navy">{isLoading ? "…" : filtered.length}</span>{" "}
            artikel
            {activeTag ? (
              <>
                {" "}
                untuk topik <span className="font-semibold text-navy">{activeTag}</span>
              </>
            ) : null}
            {query.trim() ? (
              <>
                {" "}
                yang cocok dengan “<span className="font-semibold text-navy">{query.trim()}</span>”
              </>
            ) : null}
          </p>
        </div>
      </section>

      <section className="bg-secondary/25">
        <div className="mx-auto max-w-[90rem] space-y-8 px-4 py-8 md:space-y-10 md:px-6 md:py-10">
          {isLoading ? (
            <div id="pilihan-editor" aria-busy="true" aria-label="Memuat sorotan">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Skeleton className="aspect-[16/9] w-full rounded-none sm:aspect-[5/2]" />
                <div className="space-y-2 p-4 sm:p-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-5 w-full max-w-lg" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            </div>
          ) : featured &&
            (!activeTag || featured.tags.includes(activeTag)) &&
            (!query.trim() ||
              `${featured.title} ${featured.excerpt}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())) ? (
            <div id="pilihan-editor">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-navy">
                  {blogFeatured.heading}
                </h2>
                <span className="rounded-full bg-accent-orange/15 px-2.5 py-0.5 text-[10px] font-semibold text-accent-orange">
                  {blogFeatured.badge}
                </span>
              </div>
              <PostCard post={featured} priority />
            </div>
          ) : null}

          <div
            id="daftar-artikel"
            className="min-h-[min(48vh,400px)] scroll-mt-20 md:min-h-[440px]"
          >
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-navy">
              {blogList.allArticlesHeading}
            </h2>
            {isLoading ? (
              <div
                className="grid gap-5 md:grid-cols-2 md:gap-6"
                aria-busy="true"
                aria-label="Memuat daftar artikel"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                  >
                    <Skeleton className="aspect-[16/9] w-full rounded-none sm:aspect-[5/2]" />
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[83%]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listPosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center md:py-14">
                <p className="text-sm font-medium text-navy">{blogEmpty.title}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">{blogEmpty.hint}</p>
                <button
                  type="button"
                  className="mt-4 text-xs font-semibold text-accent-orange hover:underline"
                  onClick={() => {
                    setQuery("");
                    setActiveTag(null);
                  }}
                >
                  {blogEmpty.resetLabel}
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 md:gap-6">
                {listPosts.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5 text-center shadow-sm md:p-6">
            <p className="text-base font-bold text-navy md:text-lg">{blogCta.title}</p>
            <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground md:text-sm">
              {blogCta.subtitle}
            </p>
            <Link
              to="/contact"
              data-track={TRACK_KEYS.contactCta}
              className="mt-4 inline-flex rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90 md:text-sm"
            >
              {blogCta.buttonLabel}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
