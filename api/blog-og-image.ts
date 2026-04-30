/**
 * Vercel Edge: Serve OG image for blog posts from site domain.
 *
 * Why: WhatsApp/Facebook can be flaky fetching Supabase Storage URLs directly.
 * We proxy the image through the site domain to make it more reliable and cacheable.
 */
export const config = { runtime: "edge" };

type PostPreviewRow = {
  cover_image_path: string | null;
  cover_image_url: string | null;
};

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
  return `${cleanBase}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

async function fetchCover(slug: string, base: string, anonKey: string): Promise<PostPreviewRow | null> {
  const cleanBase = base.replace(/\/+$/, "");
  const endpoint = new URL(`${cleanBase}/rest/v1/posts`);
  endpoint.searchParams.set("select", "cover_image_path,cover_image_url,status,published_at,scheduled_at");
  endpoint.searchParams.set("slug", `eq.${slug}`);
  endpoint.searchParams.set("limit", "1");

  const nowIso = new Date().toISOString();
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: "application/json",
  };

  // Published first
  const pub = new URL(endpoint.toString());
  pub.searchParams.set("status", "eq.published");
  pub.searchParams.set("published_at", `lte.${nowIso}`);
  const pubRes = await fetch(pub.toString(), { headers });
  if (pubRes.ok) {
    const rows = (await pubRes.json()) as PostPreviewRow[];
    if (rows?.[0]) return rows[0];
  }

  // Scheduled due fallback
  const sch = new URL(endpoint.toString());
  sch.searchParams.set("status", "eq.scheduled");
  sch.searchParams.set("scheduled_at", `lte.${nowIso}`);
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
  let imageUrl = "";
  try {
    const post = await fetchCover(slug, base, anonKey);
    if (post) {
      imageUrl = buildPublicCoverUrl({
        base,
        bucket: "blog-media",
        path: post.cover_image_path,
        url: post.cover_image_url,
      });
    }
  } catch {
    // ignore
  }

  if (!imageUrl) {
    imageUrl = `${origin}/octa.jpeg`;
  } else if (imageUrl.startsWith("/")) {
    imageUrl = `${origin}${imageUrl}`;
  }

  imageUrl = imageUrl.replace(/^http:\/\//i, "https://");
  const imageType = guessImageContentType(imageUrl);

  const imgRes = await fetch(imageUrl, { headers: { Accept: "image/*" } });
  if (!imgRes.ok) {
    const fallbackRes = await fetch(`${origin}/octa.jpeg`, { headers: { Accept: "image/*" } });
    return new Response(fallbackRes.body, {
      status: 200,
      headers: {
        "content-type": fallbackRes.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "public, max-age=86400",
      },
    });
  }

  return new Response(imgRes.body, {
    status: 200,
    headers: {
      "content-type": imgRes.headers.get("content-type") ?? imageType,
      "cache-control": "public, max-age=86400",
    },
  });
}

