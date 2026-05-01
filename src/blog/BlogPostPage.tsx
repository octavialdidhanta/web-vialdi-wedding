import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Clock, ListTree, Mail } from "lucide-react";
import { ReadingProgress } from "@/blog/ReadingProgress";
import { blogPostMeta, blogPostUi } from "@/blog/content";
import type { BlogPostPublic } from "@/blog/types";
import { getRelatedPosts } from "@/blog/agencySupabaseBlog";
import { usePublishedPostQuery, usePublishedPostsQuery } from "@/blog/useBlogQueries";
import { useBlogMetaWithOgImage } from "@/blog/useBlogMeta";
import { getBlogHeroCoverImgProps, getBlogThumbCoverSrc } from "@/blog/blogCoverImageUrls";
import { useBlogPostCoverPreload } from "@/blog/useBlogPostCoverPreload";
import { Footer } from "@/share/Footer";
import { Header } from "@/share/Header";
import { BlogPostBody } from "@/blog/BlogPostBody";
import {
  BlogPostShareStickyFooter,
  blogPostShareStickyFooterPageBottomPaddingClass,
} from "@/blog/BlogPostShareStickyFooter";
import { cn } from "@/share/lib/utils";

function formatPostDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-border pb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h2>
  );
}

/** LCP: preload di `<head>` + `fetchpriority` di DOM (Lighthouse memeriksa literal atribut). */
function ArticleHeroCoverImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const trimmed = src.trim();
  const imgProps = useMemo(
    () => (trimmed ? getBlogHeroCoverImgProps(trimmed) : undefined),
    [trimmed],
  );
  useBlogPostCoverPreload(imgProps);
  useLayoutEffect(() => {
    if (!trimmed) return;
    ref.current?.setAttribute("fetchpriority", "high");
  }, [trimmed]);

  if (!trimmed || !imgProps?.src) return null;

  return (
    <div className="relative flex w-full justify-center overflow-hidden">
      <img
        ref={ref}
        src={imgProps.src}
        srcSet={imgProps.srcSet}
        sizes={imgProps.sizes}
        alt={alt}
        className="relative z-0 mx-auto block h-auto w-auto max-h-[min(88vh,960px)] max-w-full object-contain"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading: loadingPost, error: errPost } = usePublishedPostQuery(slug);
  const { data: allPosts = [] } = usePublishedPostsQuery();
  const [readingProgressReady, setReadingProgressReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReadingProgressReady(true);
    };
    if (typeof requestIdleCallback !== "undefined") {
      const idleHandle = requestIdleCallback(enable, { timeout: 1800 });
      return () => {
        cancelled = true;
        cancelIdleCallback(idleHandle);
      };
    }
    const t = window.setTimeout(enable, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  const origin = window.location.origin;
  const shareUrl = slug ? `${origin}/blog/${slug}` : window.location.href;

  const title = post ? blogPostMeta.documentTitle(post.title) : blogPostMeta.notFoundDocumentTitle;
  const description = post?.excerpt ?? blogPostMeta.notFoundDescription;
  useBlogMetaWithOgImage(title, description.slice(0, 165), {
    url: shareUrl,
    image: post?.coverImage,
    type: post ? "article" : "website",
  });

  const { older, newer } = useMemo(() => {
    if (!post) {
      return {
        older: undefined as BlogPostPublic | undefined,
        newer: undefined as BlogPostPublic | undefined,
      };
    }
    const sorted = [...allPosts].sort((a, b) => b.date.localeCompare(a.date));
    const i = sorted.findIndex((p) => p.slug === post.slug);
    return {
      newer: i > 0 ? sorted[i - 1] : undefined,
      older: i >= 0 && i < sorted.length - 1 ? sorted[i + 1] : undefined,
    };
  }, [post, allPosts]);

  const related = useMemo(() => (post ? getRelatedPosts(post, allPosts, 6) : []), [post, allPosts]);

  if (loadingPost && slug) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground md:px-6">
          Memuat artikel…
        </div>
        <Footer />
      </div>
    );
  }

  if (errPost) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-lg px-4 py-16 text-center md:px-6">
          <h1 className="text-xl font-bold text-navy">{blogPostUi.loadErrorHeading}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{(errPost as Error).message}</p>
          <Link
            to="/blog"
            className="mt-6 inline-block text-sm font-semibold text-accent-orange hover:underline"
          >
            {blogPostUi.backToBlogShort}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-lg px-4 py-16 text-center md:px-6">
          <h1 className="text-xl font-bold text-navy">{blogPostUi.notFoundHeading}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{blogPostUi.notFoundSlugHint}</p>
          <Link
            to="/blog"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            {blogPostUi.backToBlogShort}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-muted/25", blogPostShareStickyFooterPageBottomPaddingClass)}>
      <Header />
      {readingProgressReady ? <ReadingProgress /> : null}

      <article className="overflow-x-hidden border-b border-border/60 bg-background">
        {/* Header artikel: polos, tanpa gradasi */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto w-full max-w-[90rem] px-4 py-5 md:px-6 md:py-6">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-navy md:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {blogPostUi.backToBlog}
            </Link>

            <div
              className={cn(
                "mt-4 grid gap-6 lg:mt-5 lg:items-start lg:gap-x-8 lg:gap-y-6 xl:gap-x-10",
                post.coverImage.trim()
                  ? "lg:grid-cols-[minmax(0,1fr)_minmax(240px,36%)]"
                  : "lg:grid-cols-1",
              )}
            >
              {/* Mobile: gambar hero dulu agar LCP lebih cepat; desktop: teks kiri, gambar kanan */}
              {post.coverImage.trim() ? (
                <figure className="relative order-1 w-full shrink-0 self-start overflow-hidden rounded-xl border border-border bg-muted lg:order-2">
                  <ArticleHeroCoverImage src={post.coverImage} alt="" />
                </figure>
              ) : null}
              <div className="order-2 min-w-0 lg:order-1">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-navy"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h1 className="mt-4 text-pretty text-2xl font-bold leading-snug tracking-tight text-navy md:mt-5 md:text-3xl md:leading-tight lg:text-[2rem] lg:leading-[1.2]">
                  {post.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground md:mt-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    {post.readTimeMinutes} menit baca
                  </span>
                </div>
                <p className="mt-5 border-l-2 border-navy/15 pl-4 text-base leading-relaxed text-muted-foreground md:mt-6 md:text-[17px] md:leading-[1.65]">
                  {post.excerpt}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Tiga kolom: kiri artikel terkait | tengah isi | kanan informasi & TOC */}
        <div className="mx-auto w-full max-w-[90rem] px-4 pb-8 pt-5 md:px-6 md:pb-10 md:pt-6">
          <div className="grid w-full grid-cols-1 gap-8 xl:grid-cols-[minmax(0,280px)_minmax(0,48rem)_minmax(0,1fr)] xl:items-start xl:gap-x-10 xl:gap-y-0 2xl:gap-x-12">
            {/* Kiri: artikel terkait */}
            <aside className="order-2 min-w-0 border-t border-border pt-6 xl:order-1 xl:sticky xl:top-24 xl:border-t-0 xl:pt-0">
              <SidebarHeading>Artikel terkait</SidebarHeading>
              {related.length ? (
                <ul className="mt-4 space-y-0 divide-y divide-border">
                  {related.map((r) => (
                    <li key={r.slug} className="py-4 first:pt-0">
                      <Link
                        to={`/blog/${r.slug}`}
                        className="group flex gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 focus-visible:ring-offset-2"
                      >
                        {r.coverImage.trim() ? (
                          <div className="relative h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            <img
                              src={getBlogThumbCoverSrc(r.coverImage, 136)}
                              alt=""
                              width={68}
                              height={68}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                            />
                          </div>
                        ) : (
                          <div
                            className="h-[4.25rem] w-[4.25rem] shrink-0 rounded-lg border border-dashed border-border bg-muted/50"
                            aria-hidden
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="line-clamp-3 text-sm font-semibold leading-snug text-navy transition-colors group-hover:text-accent-orange">
                            {r.title}
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                            <span>{formatPostDate(r.date)}</span>
                            <span aria-hidden>·</span>
                            <span>{r.readTimeMinutes} menit</span>
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">{blogPostUi.relatedEmpty}</p>
              )}

              <div className="mt-8 border-t border-border pt-6">
                <SidebarHeading>Urutan terbit</SidebarHeading>
                <nav aria-label="Artikel lebih baru dan lebih lama" className="mt-4 space-y-3">
                  {newer ? (
                    <Link
                      to={`/blog/${newer.slug}`}
                      className="flex items-start gap-2 rounded-lg border border-transparent py-1 text-sm text-navy transition-colors hover:border-border hover:bg-muted/40"
                    >
                      <ArrowLeft
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Lebih baru
                        </span>
                        <span className="mt-0.5 block font-medium leading-snug">{newer.title}</span>
                      </span>
                    </Link>
                  ) : null}
                  {older ? (
                    <Link
                      to={`/blog/${older.slug}`}
                      className="flex items-start justify-end gap-2 rounded-lg border border-transparent py-1 text-right text-sm text-navy transition-colors hover:border-border hover:bg-muted/40"
                    >
                      <span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Lebih lama
                        </span>
                        <span className="mt-0.5 block font-medium leading-snug">{older.title}</span>
                      </span>
                      <ArrowRight
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </Link>
                  ) : null}
                </nav>
              </div>
            </aside>

            {/* Tengah: isi artikel */}
            <div className="order-1 min-w-0 bg-white py-6 -mx-4 px-4 md:mx-0 md:px-0 xl:order-2 xl:-mx-2 xl:px-8 xl:py-8 2xl:px-10">
              <BlogPostBody bodyJson={post.bodyJson} bodyHtml={post.bodyHtml} />
            </div>

            {/* Kanan: informasi lainnya + daftar isi */}
            <aside className="order-3 min-w-0 w-full space-y-6 border-t border-border pt-6 xl:sticky xl:top-24 xl:border-t-0 xl:pt-0">
              <div>
                <SidebarHeading>
                  <span className="inline-flex items-center gap-2">
                    <ListTree className="h-3.5 w-3.5" aria-hidden />
                    Daftar isi
                  </span>
                </SidebarHeading>
                <nav className="mt-4" aria-label="Daftar isi artikel">
                  {post.toc.length ? (
                    <ol className="space-y-2.5 border-l border-border pl-3">
                      {post.toc.map((sec, idx) => (
                        <li key={sec.id} className="text-sm">
                          <a
                            href={`#${sec.id}`}
                            className="block text-pretty font-medium text-navy/90 transition-colors hover:text-accent-orange"
                          >
                            <span className="mr-2 tabular-nums text-muted-foreground">
                              {idx + 1}.
                            </span>
                            {sec.title}
                          </a>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Belum ada heading untuk daftar isi.
                    </p>
                  )}
                </nav>
              </div>

              <div className="w-full rounded-xl border border-border bg-muted/30 p-5">
                <SidebarHeading>
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    Informasi
                  </span>
                </SidebarHeading>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Terbit
                    </dt>
                    <dd className="mt-0.5 text-navy">{formatPostDate(post.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Estimasi baca
                    </dt>
                    <dd className="mt-0.5 text-navy">{post.readTimeMinutes} menit</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Topik
                    </dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1.5">
                      {post.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-background px-2 py-0.5 text-xs font-medium text-navy"
                        >
                          {t}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 space-y-2 border-t border-border pt-5">
                  <Link
                    to="/blog"
                    className="flex items-center gap-2 text-sm font-medium text-navy underline-offset-4 hover:underline"
                  >
                    {blogPostUi.allPostsLink}
                  </Link>
                  <Link
                    to="/contact"
                    data-track={TRACK_KEYS.contactCta}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent-orange hover:underline"
                  >
                    <Mail className="h-4 w-4 shrink-0" aria-hidden />
                    {blogPostUi.contactCta}
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>

      <BlogPostShareStickyFooter title={post.title} url={shareUrl} />
      <Footer />
    </div>
  );
}
