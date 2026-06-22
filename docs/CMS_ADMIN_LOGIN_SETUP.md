# CMS Admin Login Setup

Setup `/admin/login` untuk project Supabase CMS baru (`ivjawlslccxpnioluooh`).

Auth sudah diimplementasi di frontend — tidak perlu ubah kode untuk login dasar.

## Prasyarat Dashboard

1. **Authentication → Providers → Email** — enabled
2. **Authentication → URL Configuration** — tambahkan:
   - `http://localhost:8080`, `http://127.0.0.1:8080` (dev)
   - `https://jasafotowedding.com` (prod)

## Langkah 1 — Migrasi schema

Urutan untuk **project kosong** memakai file khusus di `supabase/migrations-cms/` (perbaikan urutan RLS + tanpa FK ke `properties`).

### Otomatis

```bash
# .env: SUPABASE_CMS_DB_PASSWORD (+ VITE_SUPABASE_URL sudah mengarah ke CMS)
npm run cms:migrate
```

Jika gagal di tengah:

```bash
npm run cms:migrate:resume        # lanjut dari agency_posts
npm run cms:migrate:resume-blog   # lanjut dari blog hub
npm run cms:migrate:packages      # property_packages + package-media (/admin/packages)
npm run cms:migrate:short-links   # visitor_count + RPC (/admin/short-links)
npm run cms:migrate:floating-whatsapp  # home_floating_whatsapp_settings
```

### Manual

Jalankan file SQL berurutan di SQL Editor (lihat [`supabase/migrations-cms/README.md`](../supabase/migrations-cms/README.md)).

## Langkah 2 — Admin pertama

### Otomatis

```bash
# .env: SUPABASE_CMS_SERVICE_ROLE_KEY, CMS_ADMIN_EMAIL, CMS_ADMIN_PASSWORD
npm run cms:bootstrap-admin
```

### Manual

1. **Authentication → Users → Add user** — Auto Confirm ON
2. Salin User UID
3. SQL Editor:

```sql
insert into public.cms_admins (user_id)
values ('PASTE-USER-UUID-DI-SINI')
on conflict (user_id) do nothing;
```

## Langkah 3 — Verifikasi

```bash
npm run cms:verify-login
npm run dev
```

Buka `http://localhost:8080/admin/login` → harapan redirect ke `/admin/posts`.

## Troubleshooting

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| `Invalid login credentials` | User belum dibuat / password salah | Cek Auth → Users |
| Login OK tapi `/admin/forbidden` | UUID tidak di `cms_admins` | `npm run cms:bootstrap-admin` atau INSERT manual |
| `relation cms_admins does not exist` | Migrasi #1 belum jalan | `npm run cms:migrate:min` |
| `Could not find table property_packages` | Hanya `agency_packages` terpasang | `npm run cms:migrate:packages` |
| `marketing_short_links.visitor_count does not exist` | Migrasi visitor belum jalan | `npm run cms:migrate:short-links` lalu `npm run cms:import-short-links` |
| `home_floating_whatsapp_settings` tidak ada | Tabel belum dimigrasi | `npm run cms:migrate:floating-whatsapp` lalu `npm run cms:import-floating-whatsapp` |
| `cms_admins` 0 row padahal sudah INSERT | `.env` salah project | URL/anon key = project CMS |
| Email tidak bisa login | User belum confirmed | Auto Confirm saat create user |
