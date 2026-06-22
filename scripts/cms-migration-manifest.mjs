/**
 * Daftar migrasi Supabase yang relevan untuk project CMS-only (tanpa analytics/leads).
 * Jalankan manual ke project Supabase baru via CLI atau copy SQL.
 */
export const CMS_MIGRATION_FILES = [
  "20260417130000_create_leads_vialdiid.sql", // properties hub — skip jika hanya properties minimal
  "20260418100001_cms_blog_seed.sql",
  "20260418140000_posts_public_select_due_scheduled.sql",
  "20260418160000_analytics_traffic.sql", // skip — analytics excluded
  "20260419140000_admin_analytics_top_paths_enriched.sql", // skip
  "20260424120000_agency_packages.sql",
  "20260424131000_agency_posts.sql",
  "20260427193500_rename_agency_posts_to_posts.sql",
  "20260427194000_posts_add_web_id_and_rls.sql",
  "20260423100000_marketing_short_links.sql",
  "20260424133000_marketing_short_links_site_origin.sql",
  "20260620100000_hub_properties_forms_submissions.sql", // partial: properties + cms only
  "20260620110000_blog_hub_categories_tags_web_id.sql",
  "20260620123800_posts_published_requires_published_at.sql",
];

/** Prefix/pattern migrasi yang harus DI-SKIP untuk CMS-only */
export const CMS_MIGRATION_EXCLUDE_PATTERNS = [
  /^analytics_/,
  /analytics/,
  /leads/,
  /lead_submissions/,
  /traffic/,
  /whatsapp/,
  /wa_click/,
  /get_traffic_dashboard/,
  /admin_analytics/,
  /refresh_rollups/,
  /analytics_web_access/,
];

console.log("CMS migrations to review manually:", CMS_MIGRATION_FILES.length);
console.log("Exclude patterns:", CMS_MIGRATION_EXCLUDE_PATTERNS.map((r) => r.source).join(", "));
