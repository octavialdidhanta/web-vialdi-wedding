import { getEdgeWebId } from "./blogWebId";

/**
 * Vercel Edge: Serve OG image for blog posts from site domain.
 *
 * Why: WhatsApp/Facebook can be flaky fetching Supabase Storage URLs directly.
 * We proxy the image through the site domain to make it more reliable and cacheable.
 *
 * Sumber gambar: utamakan `cover_image_path` (URL object/public konsisten); lalu coba
 * `cover_image_url` jika beda — mengatasi URL transform/external yang ditolak atau kadaluarsa.
 */
export const config = { runtime: "edge" };

type PostPreviewRow = {
  cover_image_path: string | null;
  cover_image_url: string | null;
};

function buildStoragePublicObjectUrl(baseNoSlash: string, bucket: string, path: string): string {
  const cleanPath = path.replace(/^\/+/, "");
  const encodedPath = cleanPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${baseNoSlash}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/** Selaras `supabaseRenderUrl` di `blog-entry.ts` — file kecil & WebP lebih ramah pratinjau WA/FB. */
function supabaseRenderUrlFromPublicObjectUrl(
  publicObjectUrl: string,
  width: number,
  quality: string,
): string | null {
  try {
    const u = new URL(publicObjectUrl);
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

function pushUniqueOrdered(out: string[], url: string, atFront: boolean) {
  const t = url.trim();
  if (!t) return;
  const n = t.replace(/^http:\/\//i, "https://");
  if (out.includes(n)) return;
  if (atFront) out.unshift(n);
  else out.push(n);
}

/**
 * Urutan: (1) render Supabase WebP jika ada, (2) object/public, (3) cover_image_url.
 * Render diprioritaskan agar ukuran mirip antar artikel — JPEG sampul besar sering gagal di pratinjau WhatsApp.
 */
function collectCoverImageCandidates(post: PostPreviewRow, supabaseBase: string): string[] {
  const cleanBase = supabaseBase.replace(/\/+$/, "");
  const out: string[] = [];

  const p = post.cover_image_path?.trim();
  if (p) {
    const publicUrl = buildStoragePublicObjectUrl(cleanBase, "blog-media", p);
    const render = supabaseRenderUrlFromPublicObjectUrl(publicUrl, 1200, "80");
    if (render) pushUniqueOrdered(out, render, true);
    pushUniqueOrdered(out, publicUrl, false);
  }

  const u = post.cover_image_url?.trim();
  if (u) {
    let full = "";
    if (u.startsWith("http://") || u.startsWith("https://")) {
      full = u;
    } else if (u.startsWith("/")) {
      full = `${cleanBase}${u}`;
    }
    if (full) {
      const render = supabaseRenderUrlFromPublicObjectUrl(
        full.replace(/^http:\/\//i, "https://"),
        1200,
        "80",
      );
      if (render) pushUniqueOrdered(out, render, true);
      pushUniqueOrdered(out, full, false);
    }
  }

  return out;
}

async function fetchCover(slug: string, base: string, anonKey: string): Promise<PostPreviewRow | null> {
  const webId = getEdgeWebId();
  const cleanBase = base.replace(/\/+$/, "");
  const endpoint = new URL(`${cleanBase}/rest/v1/posts`);
  endpoint.searchParams.set("select", "cover_image_path,cover_image_url,status,published_at,scheduled_at");
  endpoint.searchParams.set("web_id", `eq.${webId}`);
  endpoint.searchParams.set("slug", `eq.${slug}`);
  endpoint.searchParams.set("limit", "1");

  const nowIso = new Date().toISOString();
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: "application/json",
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

function guessImageContentType(url: string) {
  const u = url.toLowerCase();
  if (u.includes("format=webp")) return "image/webp";
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

  let post: PostPreviewRow | null = null;
  try {
    post = await fetchCover(slug, base, anonKey);
  } catch {
    post = null;
  }

  const candidates = post ? collectCoverImageCandidates(post, base) : [];
  if (!candidates.length) {
    return new Response(null, {
      status: 404,
      headers: { "cache-control": "public, max-age=120" },
    });
  }

  let lastStatus = 404;
  for (const imageUrl of candidates) {
    const imgRes = await fetch(imageUrl, { headers: { Accept: "image/*" } });
    lastStatus = imgRes.status;
    if (!imgRes.ok) {
      continue;
    }
    const imageType = guessImageContentType(imageUrl);
    return new Response(imgRes.body, {
      status: 200,
      headers: {
        "content-type": imgRes.headers.get("content-type") ?? imageType,
        "cache-control": "public, max-age=86400",
      },
    });
  }

  return new Response(null, {
    status: lastStatus >= 400 ? lastStatus : 404,
    headers: { "cache-control": "public, max-age=60" },
  });
}
