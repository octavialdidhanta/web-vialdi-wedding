# Short link & UTM — deploy & uji

## Ringkasan

1. **Migrasi Postgres** — tabel `marketing_short_links`, RLS admin, RPC `increment_marketing_short_link_click`.
2. **Edge Function** `link-redirect` — GET, secret `PUBLIC_SITE_ORIGIN` (mis. `https://jasafotowedding.com`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. **Frontend** — `/admin/links`, env `VITE_PUBLIC_SITE_ORIGIN` untuk URL salin.
4. **Vercel** — rewrite `/l/:slug` → `/api/shortlink-redirect` (sudah di [`vercel.json`](../vercel.json)); API Edge memakai `VITE_SUPABASE_URL` dari env project Vercel (sama seperti build SPA).

## Supabase

```bash
supabase db push
# atau migrasi manual di dashboard SQL

supabase functions deploy link-redirect --no-verify-jwt
```

Di **Project Settings → Edge Functions → Secrets** (atau CLI `supabase secrets set`):

- `PUBLIC_SITE_ORIGIN` = `https://jasafotowedding.com` (tanpa slash akhir)
- `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` biasanya sudah diset otomatis untuk functions; jika tidak, set manual.

## Vercel

Pastikan environment **Production** (dan Preview jika perlu) memuat:

- `VITE_SUPABASE_URL` — sama seperti untuk frontend (wajib untuk `api/shortlink-redirect` dan bundle).
- `VITE_PUBLIC_SITE_ORIGIN` = `https://jasafotowedding.com` — agar tombol **Salin** di admin memakai domain benar.

Deploy ulang setelah migrasi & function.

## Uji manual (checklist)

- [ ] **Redirect:** buka `https://jasafotowedding.com/l/{slug}` untuk slug aktif → address bar berakhir di path + query UTM yang diharapkan (302/307 chain).
- [ ] **UTM:** parameter `utm_source`, `utm_medium`, dll. muncul di URL final.
- [ ] **Non-admin:** user tanpa baris di `cms_admins` tidak bisa `select/insert` ke `marketing_short_links` (coba dari klien anon / user biasa).
- [ ] **Slug unik:** buat dua link dengan slug sama → error jelas di UI.
- [ ] **Klik:** kolom `click_count` bertambah setelah kunjungan (opsional, jika RPC berjalan).

## Tanpa Vercel

Gunakan URL langsung ke function (kurang rapi untuk marketing):

`{VITE_SUPABASE_URL}/functions/v1/link-redirect?slug={slug}`

Pastikan function `PUBLIC_SITE_ORIGIN` mengarah ke domain situs produksi.
