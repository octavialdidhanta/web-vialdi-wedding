/**
 * Urutan migrasi CMS untuk project kosong (fresh install).
 * Minimum login: hanya cms_admins bootstrap. Full CMS: seluruh daftar di bawah.
 *
 * Catatan: urutan asli plan melewatkan 20260427193000 (drop legacy posts) dan
 * memakai agency_posts.sql yang gagal di DB baru (RLS mereferensikan tabel belum ada).
 */
export const CMS_LOGIN_PLAN_MIGRATIONS = [
  { file: "20260418100000_cms_blog_schema.sql", dir: "migrations" },
  { file: "20260424131000_agency_posts_fresh.sql", dir: "migrations-cms" },
  { file: "20260427193000_drop_legacy_posts_and_post_tags.sql", dir: "migrations" },
  { file: "20260427193500_rename_agency_posts_to_posts.sql", dir: "migrations" },
  { file: "20260427194000_posts_add_web_id_and_rls.sql", dir: "migrations" },
  { file: "20260620110000_blog_hub_categories_tags_web_id_fresh.sql", dir: "migrations-cms" },
  { file: "20260620123800_posts_published_requires_published_at.sql", dir: "migrations" },
  { file: "20260620120000_property_packages_fresh.sql", dir: "migrations-cms" },
  { file: "20260423100000_marketing_short_links.sql", dir: "migrations" },
  { file: "20260424133000_marketing_short_links_site_origin.sql", dir: "migrations" },
  { file: "20260610130000_marketing_short_link_visitor_counts.sql", dir: "migrations" },
  { file: "20260429120000_home_floating_whatsapp_settings.sql", dir: "migrations" },
];

/** Opsional: seed blog legacy — tidak diperlukan untuk login; data legacy di-drop di 271930. */
export const CMS_LOGIN_OPTIONAL_SEED = "20260418100001_cms_blog_seed.sql";

export const CMS_LOGIN_MIN_MIGRATION = CMS_LOGIN_PLAN_MIGRATIONS[0];

/** Lanjutkan dari agency_posts setelah cms_blog_schema (#1) sudah ada. */
export const CMS_LOGIN_RESUME_FROM_AGENCY = CMS_LOGIN_PLAN_MIGRATIONS.slice(1);

/** Lanjutkan dari blog hub setelah agency path selesai. */
export const CMS_LOGIN_RESUME_FROM_BLOG_HUB = CMS_LOGIN_PLAN_MIGRATIONS.slice(5);

/** Hanya property_packages (recovery setelah agency_packages / tanpa hub). */
export const CMS_LOGIN_RESUME_PACKAGES = [
  { file: "20260620120000_property_packages_fresh.sql", dir: "migrations-cms" },
];

/** Visitor counts + RPC untuk marketing_short_links (/admin/short-links). */
export const CMS_LOGIN_RESUME_SHORT_LINKS = [
  { file: "20260610130000_marketing_short_link_visitor_counts.sql", dir: "migrations" },
];

/** Floating WhatsApp settings (/admin/floating-whatsapp + beranda). */
export const CMS_LOGIN_RESUME_FLOATING_WHATSAPP = [
  { file: "20260429120000_home_floating_whatsapp_settings.sql", dir: "migrations" },
];
