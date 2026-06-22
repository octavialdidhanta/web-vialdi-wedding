# Checklist Cutover — Synckerja + Supabase CMS Baru

## Sebelum deploy production

- [ ] Token Synckerja SDK (prod) dengan allowed origins: `https://jasafotowedding.com`
- [ ] Token Synckerja Server disimpan di Supabase CMS secrets (`SYNCKERJA_OMNI_API_*`)
- [ ] Vercel Production env: `VITE_SYNCKERJA_*`, `VITE_SUPABASE_*` (CMS baru), `VITE_CMS_PROPERTY_SLUG`
- [ ] Data blog/packages/short links sudah di project CMS baru
- [ ] Edge `link-redirect` ter-deploy di project CMS

## Setelah deploy

- [ ] Buka situs → traffic muncul di Synckerja `/digital-marketing/traffic`
- [ ] `traffic-logs` 201 dengan `page_view_id` + `session_id` (v1.4.8 — session terverifikasi)
- [ ] **`session_id` stabil** — navigasi SPA (home → service) tidak mengubah `session_id`; tab baru / reload dalam 30 menit memakai session yang sama (backup `localStorage`); `visitor_id` tetap di `localStorage`
- [ ] **Jumlah `traffic-logs` per kunjungan** (satu tab, tanpa refresh):
  - Landing saja (tunggu 5 detik, jangan klik): **1×** `traffic-logs`
  - Landing + 1 klik menu internal (mis. Service): **2×** `traffic-logs` + **1×** `click-events` (bukan 3× traffic-logs)
- [ ] Klik CTA → `traffic-logs` sebelum `click-events` (tanpa FK / tanpa 422 `SESSION_NOT_READY`)
- [ ] **Navigasi SPA — atribusi path klik** (uji di DevTools → Network):
  1. Buka `/?utm_source=test&utm_campaign=click_fix`
  2. Tunggu `POST /api/v1/traffic-logs` 201 untuk `/` — catat `session_id`, pastikan UTM ada di body
  3. Dari home, klik menu **Service** di header
  4. `POST /api/v1/click-events` → body `"path": "/"`, `"track_key": "nav_service_link"`, `session_id` sama dengan traffic-logs, `page_view_id` dari traffic-logs `/`
  5. `POST /api/v1/traffic-logs` berikutnya → `page_url` berisi `/service`, `session_id` sama, UTM first-touch tetap ada di **body** (meski URL browser tanpa `?utm_*`)
  6. Dashboard Synckerja: klik masuk journey `/` (bukan `/service`)
- [ ] Klik floating WA → `traffic-logs` sebelum `wa-link-clicks` → respons `lead_sync_status: synced`
- [ ] Stub lead + `attribution` UTM di `/omnichannel/leads` (uji `?utm_source=test_wa`)
- [ ] Submit form wedding → lead di-upgrade (session sama), bukan duplikat
- [ ] Submit form wedding → lead di `/omnichannel/leads` dengan atribusi UTM (uji `?utm_source=test`)
- [ ] Blog `/blog` dan artikel slug OK
- [ ] Admin `/admin/posts` login & edit OK
- [ ] Short link `/l/:slug` redirect OK

## Rotasi token

1. Buat token Synckerja SDK baru
2. Update Vercel env → redeploy
3. Verifikasi traffic/leads 24 jam
4. Revoke token lama di Synckerja

## Decommission project lama

Setelah 2–4 minggu stabil: export backup final, cabut env lama, nonaktifkan edge functions lama.
