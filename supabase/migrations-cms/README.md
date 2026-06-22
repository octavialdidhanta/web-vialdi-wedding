# CMS-only migrations (admin login plan)

Jalankan ke project Supabase CMS (`ivjawlslccxpnioluooh` atau `VITE_SUPABASE_URL` Anda).

## Otomatis (disarankan)

Tambahkan ke `.env` (lihat [`.env.example`](../.env.example)):

- `SUPABASE_CMS_DB_PASSWORD` — Dashboard → Project Settings → Database
- `SUPABASE_CMS_SERVICE_ROLE_KEY` — Dashboard → Settings → API → `service_role`
- `CMS_ADMIN_EMAIL` / `CMS_ADMIN_PASSWORD` — akun admin pertama

```bash
npm install
npm run cms:migrate        # full CMS schema
npm run cms:bootstrap-admin
npm run cms:verify-login
```

Recovery:

```bash
npm run cms:migrate:min           # hanya cms_admins
npm run cms:migrate:resume        # lanjut dari agency_posts
npm run cms:migrate:resume-blog   # lanjut dari blog hub
npm run cms:migrate:packages      # property_packages (/admin/packages)
npm run cms:migrate:short-links   # visitor_count + RPC (/admin/short-links)
npm run cms:migrate:floating-whatsapp  # home_floating_whatsapp_settings
npm run cms:import-short-links    # import 5 short link dari Synckerja
npm run cms:import-floating-whatsapp  # import pengaturan WA beranda
```

## File khusus `migrations-cms/`

| File | Menggantikan | Untuk |
|------|--------------|-------|
| `20260424131000_agency_posts_fresh.sql` | `agency_posts.sql` | Posts (urutan RLS benar) |
| `20260620110000_blog_hub_categories_tags_web_id_fresh.sql` | blog hub asli | Categories/tags tanpa FK `properties` |
| `20260620120000_property_packages_fresh.sql` | `agency_packages` + hub | **`/admin/packages`** (`property_packages` + `package-media`) |

Urutan penuh: [`scripts/cms-login-plan-manifest.mjs`](../scripts/cms-login-plan-manifest.mjs).

**Skip:** analytics, leads, hub `properties`/`organizations`, migrasi hub asli `20260620120000_property_packages_hub.sql`.

Panduan login: [`docs/CMS_ADMIN_LOGIN_SETUP.md`](../docs/CMS_ADMIN_LOGIN_SETUP.md).
