/**
 * Vercel Edge: Serve OG/Twitter meta for `/blog/:slug` (for social crawlers),
 * while still delivering the SPA for humans.
 *
 * Strategy:
 * - Crawlers: return HTML with OG meta (incl. og:image) so WhatsApp/Facebook show rich cards.
 * - Humans: return the SPA shell (`/index.html`) with 200 on `/blog/:slug` — no redirect (saves ~1 RTT; PSI "Document request latency").
 * - `__ui=1` memaksa shell SPA (untuk redirect dari HTML pratinjau; dihapus di klien).
 */
export const config = { runtime: "edge" };

/** Query memaksa respons SPA meski UA terdeteksi sebagai crawler (bukan untuk dibagikan). */
const UI_SPA_QUERY = "__ui";

type PostPreviewRow = {
  title: string;
  excerpt: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
};

/** Origin publik (hindari host internal saat URL rewrite ke /api/blog-entry). */
function resolvePublicOrigin(request: Request): string {
  const fwdHost = request.headers.get("x-forwarded-host");
  const fwdProto = (request.headers.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  if (fwdHost) {
    const host = fwdHost.split(",")[0].trim();
    return `${fwdProto}://${host}`;
  }
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}`;
}

/** URL dibagikan ke WhatsApp: canonical + query marketing (bukan ?slug= internal). */
function buildPublicShareUrl(publicOrigin: string, slug: string, reqUrl: URL): string {
  const canonical = `${publicOrigin}/blog/${encodeURIComponent(slug)}`;
  if (!reqUrl.search || reqUrl.pathname.includes("/api/")) {
    return canonical;
  }
  const params = new URLSearchParams(reqUrl.search);
  params.delete("slug");
  params.delete(UI_SPA_QUERY);
  const q = params.toString();
  return q ? `${canonical}?${q}` : canonical;
}

/** Blok meta OG/Twitter untuk satu artikel (dipakai template crawler + injeksi shell SPA). */
function buildArticleOgMetaBlock(opts: {
  title: string;
  description: string;
  shareUrl: string;
  canonicalUrl: string;
  imageProxyUrl: string;
  post?: PostPreviewRow;
}): string {
  const safeTitle = esc(opts.title);
  const safeDesc = esc(opts.description);
  const safeShareUrl = esc(opts.shareUrl);
  const safeCanonicalUrl = esc(opts.canonicalUrl);
  const normalizedImg = opts.imageProxyUrl ? opts.imageProxyUrl.replace(/^http:\/\//i, "https://") : "";
  const safeImg = esc(normalizedImg);
  const hasImg = Boolean(opts.imageProxyUrl);

  const lines: string[] = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDesc}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDesc}" />`,
    `<meta property="og:url" content="${safeShareUrl}" />`,
  ];
  if (hasImg) {
    // Tanpa og:image:type / width / height: proxy OG sering mengembalikan WebP hasil render,
    // sementara sampul asli bisa JPEG/PNG — meta statis 1200×630 menyesatkan dan mengganggu pratinjau WA/FB.
    lines.push(
      `<meta property="og:image" content="${safeImg}" />`,
      `<meta property="og:image:secure_url" content="${safeImg}" />`,
    );
  }
  lines.push(
    `<meta name="twitter:card" content="${hasImg ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
  );
  if (hasImg) {
    lines.push(`<meta name="twitter:image" content="${safeImg}" />`);
  }
  lines.push(`<link rel="canonical" href="${safeCanonicalUrl}" />`);
  return lines.join("\n    ");
}

/** Hapus og + meta description bawaan beranda dari index.html. */
function stripDefaultSiteOgFromShell(html: string): string {
  return html
    .replace(/<meta\s+property="og:title"[^>]*\/>\s*/gi, "")
    .replace(/<meta\s+property="og:type"[^>]*\/>\s*/gi, "")
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/gi, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>/i, "");
}

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
/**
 * Klien browser mengirim keluarga Sec-Fetch-*; bot pratinjau (curl, facebookexternalhit, dll.) biasanya tidak.
 * Lebih luas dari navigate+document saja agar WebView yang header-nya tidak lengkap tetap dapat SPA.
 */
function isLikelyBrowserClient(request: Request): boolean {
  const mode = (request.headers.get("sec-fetch-mode") ?? "").toLowerCase();
  const dest = (request.headers.get("sec-fetch-dest") ?? "").toLowerCase();
  if (mode === "navigate" && dest === "document") return true;

  const nonEmpty = (name: string) => {
    const v = request.headers.get(name);
    return v != null && v !== "";
  };
  return (
    nonEmpty("sec-fetch-site") ||
    nonEmpty("sec-fetch-mode") ||
    nonEmpty("sec-fetch-dest") ||
    nonEmpty("sec-fetch-user")
  );
}

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
  post,
}: {
  title: string;
  description: string;
  shareUrl: string;
  canonicalUrl: string;
  imageProxyUrl: string;
  post?: PostPreviewRow;
}) {
  const spaDirectUrl = `${canonicalUrl}?${UI_SPA_QUERY}=1`;
  const ogBlock = buildArticleOgMetaBlock({
    title,
    description,
    shareUrl,
    canonicalUrl,
    imageProxyUrl,
    post,
  });

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    ${ogBlock}
    <script>location.replace(${JSON.stringify(spaDirectUrl)})</script>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body></body>
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

async function serveBlogSpaShell(request: Request, slug: string): Promise<Response> {
  const publicOrigin = resolvePublicOrigin(request);
  const reqUrl = new URL(request.url);
  const fetchOrigin = `${reqUrl.protocol}//${reqUrl.host}`;
  const base = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const transformRaw = process.env.VITE_SUPABASE_IMAGE_TRANSFORM ?? "";
  const imageTransform = transformRaw === "true" || transformRaw === "1";

  const [spaRes, post] = await Promise.all([
    fetch(`${fetchOrigin}/index.html`, { headers: { Accept: "text/html" } }),
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

  if (post) {
    htmlOut = stripDefaultSiteOgFromShell(htmlOut);
    htmlOut = htmlOut.replace(/<title>[^<]*<\/title>\s*/i, "");
    const shareUrl = buildPublicShareUrl(publicOrigin, slug, reqUrl);
    const canonicalUrl = `${publicOrigin}/blog/${encodeURIComponent(slug)}`;
    const hasCover = Boolean(post.cover_image_path?.trim() || post.cover_image_url?.trim());
    const imageProxy = hasCover ? `${publicOrigin}/og/blog/${encodeURIComponent(slug)}.jpg` : "";
    const desc = (post.excerpt ?? "").trim() || "Artikel Vialdi Wedding.";
    headInjections.push(
      buildArticleOgMetaBlock({
        title: post.title || "Vialdi Wedding — Blog",
        description: desc,
        shareUrl,
        canonicalUrl,
        imageProxyUrl: imageProxy,
        post,
      }),
    );
  }

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

  if ((reqUrl.searchParams.get(UI_SPA_QUERY) ?? "") === "1") {
    return serveBlogSpaShell(request, slug);
  }

  if (isLikelyBrowserClient(request)) {
    return serveBlogSpaShell(request, slug);
  }

  const isCrawler = isSocialLinkPreviewCrawler(ua);

  if (!isCrawler) {
    return serveBlogSpaShell(request, slug);
  }

  const base = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || typeof base !== "string" || !anonKey || typeof anonKey !== "string") {
    return new Response("Server misconfiguration", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const publicOrigin = resolvePublicOrigin(request);
  const shareUrl = buildPublicShareUrl(publicOrigin, slug, reqUrl);
  const canonicalUrl = `${publicOrigin}/blog/${encodeURIComponent(slug)}`;
  const imageProxyUrl = `${publicOrigin}/og/blog/${encodeURIComponent(slug)}.jpg`;

  let title = "Vialdi Wedding — Blog";
  let description = "Artikel Vialdi Wedding.";
  let post: PostPreviewRow | null = null;

  try {
    post = await fetchPostPreview(slug, base, anonKey);
    if (post) {
      title = post.title || title;
      description = (post.excerpt ?? "").trim() || description;
    }
  } catch {
    // ignore
  }

  const hasCover = Boolean(post?.cover_image_path?.trim() || post?.cover_image_url?.trim());

  return new Response(
    html({
      title,
      description,
      shareUrl,
      canonicalUrl,
      imageProxyUrl: post && hasCover ? imageProxyUrl : "",
      post: post ?? undefined,
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

