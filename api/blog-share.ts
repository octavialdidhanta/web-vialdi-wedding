/**
 * Vercel Edge: HTML share-preview endpoint.
 * Rewrite `/s/blog/:slug` → `/api/blog-share?slug=:slug` (see vercel.json).
 *
 * Social crawlers (WhatsApp/Facebook/LinkedIn/X) fetch this URL and read OpenGraph/Twitter tags
 * without executing SPA JS. Then we redirect humans to `/blog/:slug`.
 */
export const config = { runtime: "edge" };

type PostPreviewRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
};

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildPublicCoverUrl({
  base,
  bucket,
  path,
  url,
}: {
  base: string;
  bucket: string;
  path: string | null;
  url: string | null;
}) {
  if (url) return url;
  if (!path) return "";
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  const encodedPath = cleanPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  // Do not encode bucket name; only path segments.
  return `${cleanBase}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

function html({
  title,
  description,
  shareUrl,
  url,
  imageProxyUrl,
  image,
  imageType,
}: {
  title: string;
  description: string;
  shareUrl: string;
  url: string;
  imageProxyUrl: string;
  image: string;
  imageType: string;
}) {
  const safeTitle = esc(title);
  const safeDesc = esc(description);
  const safeShareUrl = esc(shareUrl);
  const safeUrl = esc(url);
  const safeImageProxyUrl = esc(imageProxyUrl);
  const safeImg = esc(image);
  const hasImg = Boolean(image);
  const safeImgType = esc(imageType);

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <!-- Keep OG URL as the share endpoint so crawlers don't re-scrape SPA /blog/:slug -->
    <meta property="og:url" content="${safeShareUrl}" />
    ${
      hasImg
        ? [
            `<meta property="og:image" content="${safeImageProxyUrl}" />`,
            `<meta property="og:image:secure_url" content="${safeImageProxyUrl}" />`,
            `<meta property="og:image:type" content="${safeImgType}" />`,
            `<meta property="og:image:width" content="1200" />`,
            `<meta property="og:image:height" content="630" />`,
          ].join("\n    ")
        : ""
    }
    <meta name="twitter:card" content="${hasImg ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    ${hasImg ? `<meta name="twitter:image" content="${safeImageProxyUrl}" />` : ""}
    <link rel="canonical" href="${safeUrl}" />
  </head>
  <body>
    <p>Redirecting… <a href="${safeUrl}">Open article</a></p>
  </body>
</html>`;
}

async function fetchPostPreview(slug: string, base: string, anonKey: string): Promise<PostPreviewRow | null> {
  const cleanBase = base.replace(/\/+$/, "");
  const endpoint = new URL(`${cleanBase}/rest/v1/posts`);
  endpoint.searchParams.set(
    "select",
    "slug,title,excerpt,cover_image_path,cover_image_url,status,published_at,scheduled_at",
  );
  endpoint.searchParams.set("slug", `eq.${slug}`);
  endpoint.searchParams.set("limit", "1");

  // Try published first (matches frontend logic; keep it simple for crawlers).
  const pub = new URL(endpoint.toString());
  pub.searchParams.set("status", "eq.published");
  pub.searchParams.set("published_at", "not.is.null");

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: "application/json",
  };

  const pubRes = await fetch(pub.toString(), { headers });
  if (pubRes.ok) {
    const rows = (await pubRes.json()) as PostPreviewRow[];
    if (rows?.[0]) return rows[0];
  }

  // Fallback: scheduled due.
  const sch = new URL(endpoint.toString());
  sch.searchParams.set("status", "eq.scheduled");
  sch.searchParams.set("scheduled_at", "not.is.null");

  const schRes = await fetch(sch.toString(), { headers });
  if (!schRes.ok) return null;
  const rows = (await schRes.json()) as PostPreviewRow[];
  return rows?.[0] ?? null;
}

function guessImageContentType(url: string) {
  const u = url.toLowerCase();
  if (u.includes(".png")) return "image/png";
  if (u.includes(".webp")) return "image/webp";
  if (u.includes(".gif")) return "image/gif";
  return "image/jpeg";
}

function isSocialCrawler(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase();
  return (
    ua.includes("facebookexternalhit") ||
    ua.includes("facebot") ||
    ua.includes("twitterbot") ||
    ua.includes("whatsapp") ||
    ua.includes("linkedinbot") ||
    ua.includes("slackbot") ||
    ua.includes("discordbot") ||
    ua.includes("telegrambot")
  );
}

export default async function handler(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const slug = (reqUrl.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{3,128}$/.test(slug)) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const base = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || typeof base !== "string" || !anonKey || typeof anonKey !== "string") {
    return new Response("Server misconfiguration", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const origin = `${reqUrl.protocol}//${reqUrl.host}`;
  const shareUrl = `${origin}/s/blog/${encodeURIComponent(slug)}`;
  const canonical = `${origin}/blog/${encodeURIComponent(slug)}`;
  const imageProxyUrl = `${origin}/og/blog/${encodeURIComponent(slug)}.jpg`;

  let title = "Vialdi Wedding — Blog";
  let description = "Artikel Vialdi Wedding.";
  let image = "";

  try {
    const post = await fetchPostPreview(slug, base, anonKey);
    if (post) {
      title = post.title || title;
      description = (post.excerpt ?? "").trim() || description;
      image = buildPublicCoverUrl({
        base,
        bucket: "blog-media",
        path: post.cover_image_path,
        url: post.cover_image_url,
      });
    }
  } catch {
    // ignore and still serve basic HTML + redirect
  }

  // Ensure og:image is always present for reliable WhatsApp/Facebook previews.
  // Fallback to a stable public asset in /public (served at site root).
  if (!image) {
    image = `${origin}/octa.jpeg`;
  } else if (image.startsWith("/")) {
    image = `${origin}${image}`;
  }

  // WhatsApp/Facebook tend to prefer https for images.
  image = image.replace(/^http:\/\//i, "https://");
  const imageType = guessImageContentType(image);

  const ua = request.headers.get("user-agent");
  if (!isSocialCrawler(ua)) {
    // Humans: go straight to the article. Crawlers must not be redirected or they'll pick SPA OG (home).
    return Response.redirect(canonical, 302);
  }

  return new Response(
    html({
      title,
      description,
      shareUrl,
      url: canonical,
      imageProxyUrl,
      image,
      imageType,
    }),
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        // allow crawlers to cache; keep modest so updates propagate
        "cache-control": "public, max-age=300",
      },
    },
  );
}

