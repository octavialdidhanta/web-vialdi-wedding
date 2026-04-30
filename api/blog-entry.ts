/**
 * Vercel Edge: Serve OG/Twitter meta for `/blog/:slug` (for social crawlers),
 * while still delivering the SPA for humans.
 *
 * Strategy:
 * - Crawlers: return HTML with OG meta (incl. og:image) so WhatsApp/Facebook show rich cards.
 * - Humans: redirect to same URL with `__spa=1` to return the SPA shell (`/index.html`).
 */
export const config = { runtime: "edge" };

type PostPreviewRow = {
  title: string;
  excerpt: string | null;
};

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isSocialCrawler(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase();
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

function buildSpaUrl(reqUrl: URL) {
  const next = new URL(reqUrl.toString());
  next.searchParams.set("__spa", "1");
  return next.toString();
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
          ].join("\\n    ")
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
  endpoint.searchParams.set("select", "title,excerpt,status,published_at,scheduled_at");
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

export default async function handler(request: Request): Promise<Response> {
  const reqUrl = new URL(request.url);
  const slug = (reqUrl.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{3,128}$/.test(slug)) {
    return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  // If this is the human SPA pass-through request, return the SPA shell directly.
  if ((reqUrl.searchParams.get("__spa") ?? "") === "1") {
    const origin = `${reqUrl.protocol}//${reqUrl.host}`;
    const spaRes = await fetch(`${origin}/index.html`, { headers: { Accept: "text/html" } });
    return new Response(spaRes.body, {
      status: spaRes.status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        // Keep caching conservative; the SPA shell can change per deploy.
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  }

  const ua = request.headers.get("user-agent");
  const isCrawler = isSocialCrawler(ua);

  // Humans should go to SPA shell (same URL + __spa=1) so the address bar stays /blog/:slug?utm=...
  if (!isCrawler) {
    return Response.redirect(buildSpaUrl(reqUrl), 302);
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

  try {
    const post = await fetchPostPreview(slug, base, anonKey);
    if (post) {
      hasPost = true;
      title = post.title || title;
      description = (post.excerpt ?? "").trim() || description;
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
      imageProxyUrl: hasPost ? imageProxyUrl : "",
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

