import { supabase } from "@/share/supabaseClient";

export type MarketingShortLinkRow = {
  id: string;
  slug: string;
  site_origin: string | null;
  pathname: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type MarketingShortLinkInput = {
  slug: string;
  site_origin?: string | null;
  pathname: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  active: boolean;
};

const SLUG_RE = /^[a-z0-9-]{3,64}$/;

export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(normalizeSlug(slug));
}

export function isValidPathname(pathname: string): boolean {
  const p = pathname.trim();
  if (p.length === 0 || p.length > 512) return false;
  if (!p.startsWith("/")) return false;
  if (p.startsWith("//")) return false;
  if (p.toLowerCase().startsWith("/admin")) return false;
  if (p.includes("..")) return false;
  return true;
}

/** Base URL for short links shown in admin (no trailing slash). */
export function getPublicSiteOrigin(override?: string | null | undefined): string {
  const o0 = override?.trim();
  if (o0) return o0.replace(/\/+$/, "");
  const o = (import.meta.env.VITE_PUBLIC_SITE_ORIGIN as string | undefined)?.trim();
  if (o) return o.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function shortLinkPublicUrl(slug: string, overrideOrigin?: string | null): string {
  const base = getPublicSiteOrigin(overrideOrigin);
  return base ? `${base}/l/${encodeURIComponent(slug)}` : `/l/${encodeURIComponent(slug)}`;
}

const MAX_UTM_PREVIEW = 200;

function clipUtmPreview(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  if (!t) return null;
  return t.length > MAX_UTM_PREVIEW ? t.slice(0, MAX_UTM_PREVIEW) : t;
}

/**
 * Pratinjau URL panjang setelah redirect (sama struktur dengan Edge `link-redirect` + PUBLIC_SITE_ORIGIN).
 */
export function buildLongUrlPreview(parts: {
  site_origin?: string | null;
  pathname: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}): string {
  const origin = getPublicSiteOrigin(parts.site_origin);
  const pathname = (parts.pathname ?? "").trim() || "/";
  const params = new URLSearchParams();
  const pairs: [string, string | null | undefined][] = [
    ["utm_source", parts.utm_source],
    ["utm_medium", parts.utm_medium],
    ["utm_campaign", parts.utm_campaign],
    ["utm_content", parts.utm_content],
    ["utm_term", parts.utm_term],
  ];
  for (const [k, v] of pairs) {
    const c = clipUtmPreview(v);
    if (c) params.set(k, c);
  }
  const qs = params.toString();
  const pathAndQuery = qs ? `${pathname}?${qs}` : pathname;
  if (!origin) return pathAndQuery;
  return `${origin}${pathAndQuery}`;
}

export async function adminListMarketingShortLinks(): Promise<MarketingShortLinkRow[]> {
  const { data, error } = await supabase
    .from("marketing_short_links")
    .select(
      "id, slug, site_origin, pathname, utm_source, utm_medium, utm_campaign, utm_content, utm_term, active, click_count, created_at, updated_at, created_by",
    )
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MarketingShortLinkRow[];
}

export async function adminInsertMarketingShortLink(input: MarketingShortLinkInput): Promise<void> {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Sesi tidak valid. Silakan masuk lagi.");

  const slug = normalizeSlug(input.slug);
  if (!isValidSlug(slug))
    throw new Error("Slug: 3–64 karakter, huruf kecil, angka, atau tanda hubung.");
  if (!isValidPathname(input.pathname))
    throw new Error("Pathname tidak valid (harus internal, bukan /admin).");

  const { error } = await supabase.from("marketing_short_links").insert({
    slug,
    site_origin: emptyToNull(input.site_origin),
    pathname: input.pathname.trim(),
    utm_source: emptyToNull(input.utm_source),
    utm_medium: emptyToNull(input.utm_medium),
    utm_campaign: emptyToNull(input.utm_campaign),
    utm_content: emptyToNull(input.utm_content),
    utm_term: emptyToNull(input.utm_term),
    active: input.active,
    created_by: user.id,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Slug sudah dipakai. Pilih slug lain.");
    throw error;
  }
}

export async function adminUpdateMarketingShortLink(
  id: string,
  input: MarketingShortLinkInput,
): Promise<void> {
  const slug = normalizeSlug(input.slug);
  if (!isValidSlug(slug))
    throw new Error("Slug: 3–64 karakter, huruf kecil, angka, atau tanda hubung.");
  if (!isValidPathname(input.pathname))
    throw new Error("Pathname tidak valid (harus internal, bukan /admin).");

  const { error } = await supabase
    .from("marketing_short_links")
    .update({
      slug,
      site_origin: emptyToNull(input.site_origin),
      pathname: input.pathname.trim(),
      utm_source: emptyToNull(input.utm_source),
      utm_medium: emptyToNull(input.utm_medium),
      utm_campaign: emptyToNull(input.utm_campaign),
      utm_content: emptyToNull(input.utm_content),
      utm_term: emptyToNull(input.utm_term),
      active: input.active,
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("Slug sudah dipakai. Pilih slug lain.");
    throw error;
  }
}

export async function adminDeleteMarketingShortLink(id: string): Promise<void> {
  const { error } = await supabase.from("marketing_short_links").delete().eq("id", id);
  if (error) throw error;
}

function emptyToNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length ? t : null;
}

export function generateRandomSlug(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return s;
}
