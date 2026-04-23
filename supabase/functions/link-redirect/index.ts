/**
 * Supabase Edge Function: link-redirect
 *
 * GET: 302 redirect to PUBLIC_SITE_ORIGIN + pathname + optional UTM query.
 * Lookup by slug (marketing_short_links), service role.
 *
 * Secrets:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - PUBLIC_SITE_ORIGIN (e.g. https://jasafotowedding.com, no trailing slash)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const MAX_PATH_LEN = 512;
const MAX_UTM_LEN = 200;

type LinkRow = {
  id: string;
  slug: string;
  pathname: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  active: boolean;
};

function mustGetEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v?.trim()) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

function normalizeOrigin(raw: string): string {
  const s = raw.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) throw new Error("PUBLIC_SITE_ORIGIN must start with http:// or https://");
  return s;
}

function extractSlug(reqUrl: string): string | null {
  const url = new URL(reqUrl);
  const fromQuery = url.searchParams.get("slug")?.trim().toLowerCase();
  if (fromQuery && /^[a-z0-9-]{3,64}$/.test(fromQuery)) return fromQuery;

  const path = url.pathname.replace(/\/+$/, "") || "/";
  const markers = ["/functions/v1/link-redirect/", "/link-redirect/"];
  for (const m of markers) {
    const i = path.indexOf(m);
    if (i !== -1) {
      const rest = path.slice(i + m.length).split("/").filter(Boolean)[0];
      if (rest && /^[a-z0-9-]{3,64}$/i.test(rest)) return rest.toLowerCase();
    }
  }
  return null;
}

function isValidPathname(p: string): boolean {
  if (typeof p !== "string" || p.length === 0 || p.length > MAX_PATH_LEN) return false;
  if (!p.startsWith("/")) return false;
  if (p.startsWith("//")) return false;
  if (p.toLowerCase().startsWith("/admin")) return false;
  if (p.includes("..")) return false;
  if (p.includes("\0")) return false;
  return true;
}

function clipUtm(s: string | null): string | null {
  if (s == null) return null;
  const t = s.trim();
  if (!t) return null;
  return t.length > MAX_UTM_LEN ? t.slice(0, MAX_UTM_LEN) : t;
}

function buildLocation(origin: string, row: LinkRow): string {
  const params = new URLSearchParams();
  const pairs: [string, string | null][] = [
    ["utm_source", row.utm_source],
    ["utm_medium", row.utm_medium],
    ["utm_campaign", row.utm_campaign],
    ["utm_content", row.utm_content],
    ["utm_term", row.utm_term],
  ];
  for (const [k, v] of pairs) {
    const c = clipUtm(v);
    if (c) params.set(k, c);
  }
  const qs = params.toString();
  return qs ? `${origin}${row.pathname}?${qs}` : `${origin}${row.pathname}`;
}

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, HEAD, OPTIONS",
        "access-control-max-age": "86400",
      },
    });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  let origin: string;
  try {
    origin = normalizeOrigin(mustGetEnv("PUBLIC_SITE_ORIGIN"));
  } catch {
    return new Response("Server misconfiguration", { status: 500 });
  }

  const slug = extractSlug(req.url);
  if (!slug) return notFound();

  const supabaseUrl = mustGetEnv("SUPABASE_URL");
  const serviceKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("marketing_short_links")
    .select("id, slug, pathname, utm_source, utm_medium, utm_campaign, utm_content, utm_term, active")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data || !(data as LinkRow).pathname) return notFound();

  const row = data as LinkRow;
  if (!isValidPathname(row.pathname)) return notFound();

  const location = buildLocation(origin, row);

  try {
    await supabase.rpc("increment_marketing_short_link_click", { p_id: row.id });
  } catch {
    // non-blocking
  }

  if (req.method === "HEAD") {
    return new Response(null, { status: 302, headers: { Location: location } });
  }

  return Response.redirect(location, 302);
});
