/** CMS property slug (posts, packages). Synckerja `web_id` is bound to the SDK token, not this env. */
export type CmsPropertySlug = string;

const SLUG_RE = /^[a-z0-9-]{3,64}$/;

export function getCmsPropertySlug(): string | null {
  const raw = (
    import.meta.env.VITE_CMS_PROPERTY_SLUG ??
    import.meta.env.VITE_WEB_ID
  )?.trim();
  if (!raw || !SLUG_RE.test(raw)) return null;
  return raw;
}

export function getRequiredCmsPropertySlug(): CmsPropertySlug {
  const slug = getCmsPropertySlug();
  if (!slug) {
    throw new Error(
      "VITE_CMS_PROPERTY_SLUG harus diset (slug lowercase, 3–64 karakter, contoh: vialdi-wedding)",
    );
  }
  return slug;
}

/** @deprecated Use getRequiredCmsPropertySlug — kept for incremental migration */
export function getRequiredWebId(): CmsPropertySlug {
  return getRequiredCmsPropertySlug();
}

export type AnalyticsWebId = CmsPropertySlug;
