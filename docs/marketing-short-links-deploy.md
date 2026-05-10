# Short link & UTM — deploy & uji

## Ringkasan

1. **Migrasi Postgres** — tabel `marketing_short_links`, RLS admin, RPC `increment_marketing_short_link_click`, kolom `visitor_count`, tabel `marketing_short_link_visitors`, RPC `record_marketing_short_link_visitor`.
2. **Edge Function** `link-redirect` — GET/HEAD, secret `PUBLIC_SITE_ORIGIN` (mis. `https://jasafotowedding.com`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Membaca header `X-Sl-Visitor` (dari proxy Vercel) atau cookie `vialdi_sl_vid` untuk pengunjung unik per slug.
3. **Frontend** — `/admin/links`, env `VITE_PUBLIC_SITE_ORIGIN` untuk URL salin.
4. **Vercel** — rewrite `/l/:slug` → `/api/shortlink-redirect` (sudah di [`vercel.json`](../vercel.json)); route ini **mem-proxy** ke Supabase (fetch server-side, bukan 307 ke domain Supabase) agar cookie first-party `vialdi_sl_vid` mengikat ke domain situs Anda. Perlu `VITE_SUPABASE_URL` dan **`VITE_SUPABASE_ANON_KEY`** (sama seperti frontend) untuk memanggil function dari Edge Vercel.

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
- `VITE_SUPABASE_ANON_KEY` — wajib untuk `api/shortlink-redirect` (Bearer + `apikey` ke Edge Function).
- `VITE_PUBLIC_SITE_ORIGIN` = `https://jasafotowedding.com` — agar tombol **Salin** di admin memakai domain benar.

Deploy ulang setelah migrasi & function.

## Uji manual (checklist)

- [ ] **Redirect:** buka `https://jasafotowedding.com/l/{slug}` untuk slug aktif → address bar berakhir di path + query UTM yang diharapkan (302/307 chain).
- [ ] **UTM:** parameter `utm_source`, `utm_medium`, dll. muncul di URL final.
- [ ] **Non-admin:** user tanpa baris di `cms_admins` tidak bisa `select/insert` ke `marketing_short_links` (coba dari klien anon / user biasa).
- [ ] **Slug unik:** buat dua link dengan slug sama → error jelas di UI.
- [ ] **Klik mentah:** kolom `click_count` bertambah setiap redirect (opsional, jika RPC berjalan).
- [ ] **Visitor:** kolom `visitor_count` bertambah sekali per browser/cookie per slug; hover baris admin menunjukkan total redirect (`click_count`).

## Tanpa Vercel

Gunakan URL langsung ke function (kurang rapi untuk marketing):

`{VITE_SUPABASE_URL}/functions/v1/link-redirect?slug={slug}`

Pastikan function `PUBLIC_SITE_ORIGIN` mengarah ke domain situs produksi.
