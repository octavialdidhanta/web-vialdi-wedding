export function buildShareText(title: string, url: string) {
  const t = title.trim();
  const u = url.trim();
  if (t && u) return `${t} ${u}`;
  return t || u;
}

export type BlogShareUtmSource = "facebook" | "whatsapp" | "x" | "linkedin";

export type BlogShareUtmFull = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
};

/** Menempelkan keempat parameter UTM ke URL artikel (mengganti nilai jika kunci sudah ada). */
export function withBlogShareUtmParams(baseUrl: string, params: BlogShareUtmFull): string {
  const u = new URL(baseUrl);
  u.searchParams.set("utm_source", params.utm_source);
  u.searchParams.set("utm_medium", params.utm_medium);
  u.searchParams.set("utm_campaign", params.utm_campaign);
  u.searchParams.set("utm_content", params.utm_content);
  return u.toString();
}

/** Nilai UTM untuk tombol salin tautan di footer artikel (selain `utm_content` = slug). */
export const BLOG_FOOTER_COPY_UTM = {
  utm_source: "copy",
  utm_medium: "share_footer",
  utm_campaign: "blog_share",
} as const;

/**
 * URL artikel + UTM 4 parameter (selaras tombol salin: medium, campaign, content=slug; `utm_source` per kanal).
 */
export function buildBlogFooterTrackedArticleUrl(
  articleBaseUrl: string,
  slug: string,
  utmSource: string,
): string {
  return withBlogShareUtmParams(articleBaseUrl, {
    utm_source: utmSource,
    utm_medium: BLOG_FOOTER_COPY_UTM.utm_medium,
    utm_campaign: BLOG_FOOTER_COPY_UTM.utm_campaign,
    utm_content: slug.trim() || "blog",
  });
}

/** Tautan salin: `utm_source=copy` + tiga parameter lain sama seperti kanal footer lain. */
export function buildBlogFooterCopyUrl(articleBaseUrl: string, slug: string): string {
  return buildBlogFooterTrackedArticleUrl(articleBaseUrl, slug, BLOG_FOOTER_COPY_UTM.utm_source);
}

/**
 * Teks untuk wa.me: URL di baris pertama agar pratinjau (sampul) terdeteksi seperti paste tautan manual.
 */
export function buildWhatsAppShareMessageForBlog(title: string, trackedArticleUrl: string): string {
  const u = trackedArticleUrl.trim();
  const t = title.trim();
  if (!t) return u;
  return `${u}\n\n${t}`;
}

export function withBlogShareUtm(url: string, source: BlogShareUtmSource) {
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  u.searchParams.set("utm_medium", "share_footer");
  u.searchParams.set("utm_campaign", "blog_share");
  return u.toString();
}

export function buildFacebookShareUrl(url: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function buildTwitterShareUrl(text: string, url: string) {
  const params = new URLSearchParams();
  if (text.trim()) params.set("text", text);
  if (url.trim()) params.set("url", url);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildLinkedInShareUrl(url: string) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function buildWhatsAppShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

