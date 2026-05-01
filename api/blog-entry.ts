/**
 * Vercel Edge: Serve OG/Twitter meta for `/blog/:slug` (for social crawlers),
 * while still delivering the SPA for humans.
 *
 * Strategy:
 * - Crawlers: return HTML with OG meta (incl. og:image) so WhatsApp/Facebook show rich cards.
 * - Humans: return the SPA shell (`/index.html`) with 200 on `/blog/:slug` — no redirect (saves ~1 RTT; PSI "Document request latency").
 * - `__spa=1` is still accepted for old links; same response body.
 */
export const config = { runtime: "edge" };

type PostPreviewRow = {
  title: string;
  excerpt: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
};

const BLOG_MEDIA_BUCKET = "blog-media";

/** Selaras `BLOG_HERO_SIZES` di `blogCoverImageUrls.ts` */
const HERO_IMG_SIZES =
  "(max-width: 1023px) min(100vw - 2rem, 22rem), min(26vw, 22rem)" as const;

function escAttr(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function publicStorageObjectUrl(supabaseBase: string, objectPath: string): string {
  const base = supabaseBase.replace(/\/+$/, "");
  const path = objectPath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${BLOG_MEDIA_BUCKET}/${path}`;
}

function supabaseRenderUrl(originalUrl: string, width: number, quality: string): string | null {
  try {
    const u = new URL(originalUrl);
    if (!u.hostname.endsWith(".supabase.co")) return null;
    const marker = "/storage/v1/object/public/";
    const i = u.pathname.indexOf(marker);
    if (i === -1) return null;
    const rest = u.pathname.slice(i + marker.length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const bucket = rest.slice(0, slash);
    const obj = rest.slice(slash + 1);
    if (!obj) return null;
    const params = new URLSearchParams({
      width: String(width),
      quality,
      format: "webp",
    });
    return `${u.origin}/storage/v1/render/image/public/${bucket}/${obj}?${params.toString()}`;
  } catch {
    return null;
  }
}

/**
 * Tag `<link rel=preload as=image>` untuk LCP — browser mulai unduh sebelum bundle React.
 */
function buildCoverPreloadLinkTag(
  post: PostPreviewRow,
  supabaseBase: string,
  imageTransform: boolean,
): string | null {
  const urlRaw = post.cover_image_url?.trim();
  const pathRaw = post.cover_image_path?.trim();
  const original = urlRaw || (pathRaw ? publicStorageObjectUrl(supabaseBase, pathRaw) : "");
  if (!original) return null;

  if (!imageTransform) {
    const href = escAttr(original);
    return `<link rel="preload" as="image" href="${href}" imagesizes="${HERO_IMG_SIZES}" fetchpriority="high" />`;
  }

  const q = "76";
  const u360 = supabaseRenderUrl(original, 360, q);
  const u480 = supabaseRenderUrl(original, 480, q);
  const u640 = supabaseRenderUrl(original, 640, q);
  const href = u480 ?? u360 ?? original;
  const srcParts: string[] = [];
  if (u360) srcParts.push(`${u360} 360w`);
  if (u480) srcParts.push(`${u480} 480w`);
  if (u640) srcParts.push(`${u640} 640w`);
  const srcSet = srcParts.join(", ");
  if (!srcSet) {
    const safe = escAttr(href);
    return `<link rel="preload" as="image" href="${safe}" imagesizes="${HERO_IMG_SIZES}" fetchpriority="high" />`;
  }
  return `<link rel="preload" as="image" href="${escAttr(href)}" imagesrcset="${escAttr(srcSet)}" imagesizes="${HERO_IMG_SIZES}" fetchpriority="high" />`;
}

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Pratinjau tautan (tanpa JS) — bukan WebView in-app yang bisa jalankan SPA.
 * WebView WhatsApp/Instagram/Facebook memakai UA berisi "whatsapp"/"instagram"/FB IAB
 * plus Mozilla + AppleWebKit; itu pengguna sungguhan → jangan layan HTML OG minimal.
 */
function isSocialLinkPreviewCrawler(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase();
  const hasWebKitEngine = ua.includes("mozilla/") && ua.includes("applewebkit/");
  if (
    hasWebKitEngine &&
    (ua.includes("whatsapp/") ||
      ua.includes("instagram") ||
      ua.includes("fbav/") ||
      ua.includes("fban/") ||
      ua.includes("fb_iab") ||
      ua.includes("line/"))
  ) {
    return false;
  }

  return (
    ua.includes("facebookexternalhit") ||
    ua.includes("facebot") ||
    ua.includes("whatsapp") ||
    ua.includes("twitterbot") ||
    ua.includes("linkedinbot") ||
    ua.includes("slackbot") ||
    ua.includes("discordbot") ||
    ua.includes("telegrambot")
  );
}

function html({
  title,
  description,
  shareUrl,
  canonicalUrl,
  imageProxyUrl,
}: {
  title: string;
  description: string;
  shareUrl: string;
  canonicalUrl: string;
  imageProxyUrl: string;
}) {
  const safeTitle = esc(title);
  const safeDesc = esc(description);
  const safeShareUrl = esc(shareUrl);
  const safeCanonicalUrl = esc(canonicalUrl);
  const normalizedImg = imageProxyUrl ? imageProxyUrl.replace(/^http:\/\//i, "https://") : "";
  const safeImg = esc(normalizedImg);
  const hasImg = Boolean(imageProxyUrl);

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
    <meta property="og:url" content="${safeShareUrl}" />
    ${
      hasImg
        ? [
            `<meta property="og:image" content="${safeImg}" />`,
            `<meta property="og:image:secure_url" content="${safeImg}" />`,
            `<meta property="og:image:type" content="image/jpeg" />`,
            `<meta property="og:image:width" content="1200" />`,
            `<meta property="og:image:height" content="630" />`,
          ].join("\n    ")
        : ""
    }
    <meta name="twitter:card" content="${hasImg ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    ${hasImg ? `<meta name="twitter:image" content="${safeImg}" />` : ""}
    <link rel="canonical" href="${safeCanonicalUrl}" />
  </head>
  <body>
    <p>Open article: <a href="${safeCanonicalUrl}">${safeCanonicalUrl}</a></p>
  </body>
</html>`;
}

async function fetchPostPreview(slug: string, base: string, anonKey: string): Promise<PostPreviewRow | null> {
  const cleanBase = base.replace(/\/+$/, "");
  const endpoint = new URL(`${cleanBase}/rest/v1/posts`);
  endpoint.searchParams.set(
    "select",
    "title,excerpt,cover_image_path,cover_image_url,status,published_at,scheduled_at",
  );
  endpoint.searchParams.set("slug", `eq.${slug}`);
  endpoint.searchParams.set("limit", "1");

  const nowIso = new Date().toISOString();
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };

  const pub = new URL(endpoint.toString());
  pub.searchParams.set("status", "eq.published");
  pub.searchParams.set("published_at", `lte.${nowIso}`);
  const pubRes = await fetch(pub.toString(), { headers });
  if (pubRes.ok) {
    const rows = (await pubRes.json()) as PostPreviewRow[];
    if (rows?.[0]) return rows[0];
  }

  const sch = new URL(endpoint.toString());
  sch.searchParams.set("status", "eq.scheduled");
  sch.searchParams.set("scheduled_at", `lte.${nowIso}`);
  const schRes = await fetch(sch.toString(), { headers });
  if (!schRes.ok) return null;
  const rows = (await schRes.json()) as PostPreviewRow[];
  return rows?.[0] ?? null;
}

async function serveBlogSpaShell(reqUrl: URL, slug: string): Promise<Response> {
  const origin = `${reqUrl.protocol}//${reqUrl.host}`;
  const base = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const transformRaw = process.env.VITE_SUPABASE_IMAGE_TRANSFORM ?? "";
  const imageTransform = transformRaw === "true" || transformRaw === "1";

  const [spaRes, post] = await Promise.all([
    fetch(`${origin}/index.html`, { headers: { Accept: "text/html" } }),
    typeof base === "string" && base && typeof anonKey === "string" && anonKey
      ? fetchPostPreview(slug, base, anonKey).catch(() => null)
      : Promise.resolve(null),
  ]);

  let htmlOut = await spaRes.text();

  let supabaseOrigin = "";
  if (typeof base === "string" && base) {
    try {
      supabaseOrigin = new URL(base).origin;
    } catch {
      supabaseOrigin = "";
    }
  }

  const headInjections: string[] = [];
  if (supabaseOrigin) {
    headInjections.push(`<link rel="preconnect" href="${escAttr(supabaseOrigin)}" crossorigin />`);
  }
  if (post && typeof base === "string" && base) {
    const preload = buildCoverPreloadLinkTag(post, base, imageTransform);
    if (preload) headInjections.push(preload);
  }
  if (headInjections.length) {
    htmlOut = htmlOut.replace(
      /<meta\s+charset=["']UTF-8["']\s*\/?>/i,
      (m) => `${m}\n    ${headInjections.join("\n    ")}`,
    );
  }

  return new Response(htmlOut, {
    status: spaRes.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Keep caching conservative; the SPA shell can change per deploy.
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const slug = (reqUrl.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{3,128}$/.test(slug)) {
    return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const ua = request.headers.get("user-agent");
  const isCrawler = isSocialLinkPreviewCrawler(ua);

  // Humans: SPA shell in one round-trip (no ?__spa=1 redirect). `__spa=1` is ignored but harmless in the bar.
  if (!isCrawler) {
    return serveBlogSpaShell(reqUrl, slug);
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
  const shareUrl = `${origin}/blog/${encodeURIComponent(slug)}${reqUrl.search ? reqUrl.search : ""}`;
  const canonicalUrl = `${origin}/blog/${encodeURIComponent(slug)}`;
  const imageProxyUrl = `${origin}/og/blog/${encodeURIComponent(slug)}.jpg`;

  let title = "Vialdi Wedding — Blog";
  let description = "Artikel Vialdi Wedding.";
  let hasPost = false;
  let hasCover = false;

  try {
    const post = await fetchPostPreview(slug, base, anonKey);
    if (post) {
      hasPost = true;
      title = post.title || title;
      description = (post.excerpt ?? "").trim() || description;
      hasCover = Boolean(post.cover_image_path?.trim() || post.cover_image_url?.trim());
    }
  } catch {
    // ignore
  }

  return new Response(
    html({
      title,
      description,
      shareUrl,
      canonicalUrl,
      imageProxyUrl: hasPost && hasCover ? imageProxyUrl : "",
    }),
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    },
  );
}

