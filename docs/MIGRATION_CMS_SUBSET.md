# Migrasi Supabase CMS — Subset Schema

Project Supabase **baru** hanya untuk CMS website. Analytics & leads masuk Synckerja via Omnichannel API.

## Langkah manual (Fase 0)

1. Buat project Supabase baru (mis. `vialdi-wedding-cms`).
2. Jalankan migrasi CMS dari folder `supabase/migrations-cms/` (lihat manifest di bawah).
3. Export data dari project lama:
   - Tabel: `posts`, `blog_categories`, `blog_tags`, `post_tags`, `property_packages`, `marketing_short_links`, `home_floating_whatsapp_settings`, `cms_admins`, `properties` (baris `vialdi-wedding`).
   - Storage: bucket `blog-media`, `package-media`.
4. Import ke project baru; buat ulang admin di Supabase Auth + baris `cms_admins`.
5. Deploy edge function `link-redirect` ke project CMS.
6. Set Vercel env ke URL/anon key **project baru** + token Synckerja SDK.

## Migrasi yang di-include

Lihat [`scripts/cms-migration-manifest.mjs`](../scripts/cms-migration-manifest.mjs).

## Migrasi yang di-exclude

- Semua `analytics_*`, `leads`, `lead_submissions`, `analytics_web_access`
- RPC traffic dashboard, rollups
- Edge: `analytics-ingest`, `wa-click-track`, `contact-submit`, `contact-lead`, `whatsapp-webhook`, `traffic-refresh-rollups`
