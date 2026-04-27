function normalizeToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

/**
 * Build a stable key for accordion toggles.
 * Example: "Bonus" -> "package_section_bonus_toggle_cta"
 */
export function buildPackageSectionToggleTrackKey(title: string): string {
  const t = normalizeToken(title) || "section";
  return `package_section_${t}_toggle_cta`.slice(0, 80);
}

