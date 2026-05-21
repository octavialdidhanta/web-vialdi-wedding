/**
 * Slug artikel dari lokasi browser.
 * URL seperti `/blog/foo?-bar` memotong slug di `?` (sisa jadi query string); gabungkan kembali ke `foo-bar`.
 */
export function blogSlugFromLocation(
  pathname: string,
  search: string,
  routeParamSlug?: string,
): string {
  const prefix = "/blog/";
  let fromPath = "";
  if (pathname.startsWith(prefix)) {
    fromPath = decodeURIComponent(pathname.slice(prefix.length).replace(/\/$/, ""));
  }
  const pathSlug = fromPath || routeParamSlug?.trim() || "";

  if (!search || search === "?") {
    return pathSlug;
  }

  const q = search.startsWith("?") ? search.slice(1) : search;
  // Legacy: tautan salah — query tanpa `=` adalah lanjutan slug (sering diawali `-`).
  if (q && !q.includes("=")) {
    const suffix = q.replace(/^-+/, "").trim();
    if (suffix) {
      return `${pathSlug}-${suffix}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
    }
  }

  return pathSlug;
}

/** Kandidat slug untuk lookup DB (normalisasi + perbaikan `?` di string slug). */
export function blogSlugLookupCandidates(slug: string): string[] {
  const raw = slug.trim();
  if (!raw) return [];

  const out = new Set<string>();
  const push = (s: string) => {
    const t = s.trim().toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (t) out.add(t);
  };

  push(raw);

  if (raw.includes("?")) {
    const parts = raw.split("?").map((p) => p.replace(/^-+/, "").trim()).filter(Boolean);
    if (parts.length > 1) {
      push(parts.join("-"));
    }
    if (parts[0]) push(parts[0]);
  }

  return [...out];
}

export function blogPostPath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`;
}
