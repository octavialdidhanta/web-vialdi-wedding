/**
 * Vercel Edge: internal target for rewrite `/l/:slug` → `/api/shortlink-redirect?slug=:slug`.
 * Proxies to Supabase Edge Function `link-redirect` using VITE_SUPABASE_URL (set in Vercel env).
 *
 * Uses server-side fetch + `redirect: "manual"` so the browser never opens the Supabase function URL;
 * `Set-Cookie` for visitor dedupe stays on your site domain (first-party).
 */
export const config = { runtime: "edge" };

const COOKIE = "vialdi_sl_vid";

function parseVid(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k !== COOKIE) continue;
    try {
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      return v.length ? v : null;
    } catch {
      return null;
    }
  }
  return null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{3,64}$/.test(slug)) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const base = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || typeof base !== "string" || !anon || typeof anon !== "string") {
    return new Response("Server misconfiguration", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  let vid = parseVid(request.headers.get("cookie"));
  if (!vid || !UUID_RE.test(vid)) {
    vid = crypto.randomUUID();
  }

  const origin = `${url.protocol}//${url.host}`;
  const edge = `${base.replace(/\/+$/, "")}/functions/v1/link-redirect?slug=${encodeURIComponent(slug)}&origin=${encodeURIComponent(origin)}`;

  const res = await fetch(edge, {
    method: request.method,
    redirect: "manual",
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      "X-Sl-Visitor": vid,
    },
  });

  const loc = res.headers.get("Location");
  if (res.status >= 300 && res.status < 400 && loc) {
    const secure = url.protocol === "https:";
    const setCookie = `${COOKIE}=${encodeURIComponent(vid)}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly${
      secure ? "; Secure" : ""
    }`;
    const status = res.status === 307 || res.status === 308 ? res.status : 302;
    return new Response(null, {
      status,
      headers: {
        Location: loc,
        "Set-Cookie": setCookie,
      },
    });
  }

  const ct = res.headers.get("content-type") ?? "text/plain; charset=utf-8";
  const body = await res.arrayBuffer();
  return new Response(body, { status: res.status, headers: { "content-type": ct } });
}
