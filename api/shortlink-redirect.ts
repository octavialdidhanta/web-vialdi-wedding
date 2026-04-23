/**
 * Vercel Edge: internal target for rewrite `/l/:slug` → `/api/shortlink-redirect?slug=:slug`.
 * Proxies to Supabase Edge Function `link-redirect` using VITE_SUPABASE_URL (set in Vercel env).
 */
export const config = { runtime: "edge" };

export default function handler(request: Request): Response {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{3,64}$/.test(slug)) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  const base = process.env.VITE_SUPABASE_URL;
  if (!base || typeof base !== "string") {
    return new Response("Server misconfiguration", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  const edge = `${base.replace(/\/+$/, "")}/functions/v1/link-redirect?slug=${encodeURIComponent(slug)}`;
  return Response.redirect(edge, 307);
}
