# WhatsApp template env per `web_id` (Supabase Edge)

Edge Functions [`wedding-package-lead`](../supabase/functions/wedding-package-lead/index.ts) dan [`contact-lead`](../supabase/functions/contact-lead/index.ts) menggabungkan **database** (jika ada baris), secret **`__SUFFIX`**, lalu secret **global**.

## Prioritas resolusi (dari kuat ke lemah)

1. **`public.organization_whatsapp_templates`** — satu baris per `(organization_id, web_id)` yang `is_active = true`. Kolom yang **terisi** (non-kosong) mengganti nilai dari langkah di bawah; kolom kosong/null di DB → pakai env untuk field itu saja.
2. Secret env dengan pola **`BASIS__SUFFIX`** (mis. `WHATSAPP_TEMPLATE_NAME__VIALDI`).
3. Secret **global** (`WHATSAPP_TEMPLATE_NAME`, dll.).

Tanpa baris di tabel dan tanpa `__SUFFIX`, perilaku sama dengan **hanya global** (deployment lama).

Migrasi tabel: [`supabase/migrations/20260426120000_organization_whatsapp_templates.sql`](../supabase/migrations/20260426120000_organization_whatsapp_templates.sql). Tabel ini **RLS enabled** tanpa policy untuk `anon`/`authenticated`; Edge memakai **service role** (bypass RLS). Kelola baris lewat SQL editor, migrasi seed, atau tooling internal — bukan dari klien anon.

### Contoh `INSERT` (ganti UUID org dan nama template)

```sql
insert into public.organization_whatsapp_templates (
  organization_id,
  web_id,
  is_active,
  template_name,
  template_language,
  body_keys,
  body_parameter_names,
  components_json
) values (
  '663c9336-8cb6-4a36-9ad9-313126e70a1a',  -- samakan dengan ORG_ID di Edge (organisasi Anda)
  'vialdi',
  true,
  'nama_template_di_meta',
  'id',
  'name,industry,business_type,office_address,needs,ringkasan_kebutuhan',
  null,
  null
);
```

Kolom `components_json` bisa berisi JSON array panjang (cek batas praktis Postgres / payload); untuk template body-only cukup `null`.

---

Edge Functions juga membaca secret template Meta dengan **fallback global** seperti sebelumnya. Secret **tambahan** dengan pola `BASIS__SUFFIX` meng-override nilai global **hanya** untuk `web_id` yang cocok (setelah merge dengan DB di atas).

## Kapan dipakai

- Satu project Supabase, banyak situs / bisnis, **template WhatsApp berbeda** per situs.
- Tanpa secret `__SUFFIX`, perilaku **identik** dengan deployment lama (hanya `WHATSAPP_TEMPLATE_*` global).

## Aturan suffix

Dari nilai `web_id` (mis. dari analytics session, sama seperti routing `organization_whatsapp_accounts`):

1. Trim string.
2. **UPPERCASE**.
3. Setiap run karakter non `[A-Z0-9]` diganti **satu** underscore `_`.
4. Hapus underscore di awal/akhir.

| `web_id`         | Suffix env      |
|------------------|-----------------|
| `vialdi`         | `VIALDI`        |
| `vialdi-wedding` | `VIALDI_WEDDING`|

## Resolusi per secret

Untuk setiap nama basis `B`:

1. Coba `B__SUFFIX` (dua underscore), contoh: `WHATSAPP_TEMPLATE_NAME__VIALDI_WEDDING`.
2. Jika kosong → pakai `B` (global).

Jika `web_id` tidak ada atau kosong, **hanya langkah 2** (perilaku lama).

## Nama secret yang didukung (basis)

Semua ini mendukung override `__SUFFIX`:

- `WHATSAPP_TEMPLATE_NAME`
- `WHATSAPP_TEMPLATE_LANGUAGE`
- `WHATSAPP_TEMPLATE_BODY_KEYS`
- `WHATSAPP_TEMPLATE_BODY_PARAMETER_NAMES`
- `WHATSAPP_TEMPLATE_COMPONENTS_JSON`

Nilai global tetap dipakai untuk basis yang **tidak** Anda set per suffix.

## Contoh

**Wedding** pakai template A, **agency** (`vialdi`) pakai template B, sisanya global:

- `WHATSAPP_TEMPLATE_NAME` → default wedding (mis. `template_wedding`)
- `WHATSAPP_TEMPLATE_NAME__VIALDI` → `template_agency`
- `WHATSAPP_TEMPLATE_BODY_KEYS__VIALDI` → daftar kunci CSV yang sesuai template B (harus sejajar dengan parameter Meta)

Jika template B memakai parameter bernama, set juga:

- `WHATSAPP_TEMPLATE_BODY_PARAMETER_NAMES__VIALDI` → sama jumlahnya dengan `BODY_KEYS`.

## `WHATSAPP_TEMPLATE_COMPONENTS_JSON`

JSON array komponen Graph API (header/body/button). Bisa panjang; platform secret kadang punya **batas panjang** — pertimbangkan template sederhana atau body-only jika tidak muat.

Gunakan `__none__` (sama seperti global) untuk memaksa tidak mengirim komponen override dari env per suffix.

## Matriks uji manual

| Skenario | Secret | Harapan |
|----------|--------|---------|
| Tanpa `__*` | Hanya global | Sama seperti sebelum per-`web_id` |
| `WHATSAPP_TEMPLATE_NAME__VIALDI` saja | Agency `web_id` vialdi | Nama template agency; wedding tetap global |
| Set lengkap per suffix | Keys + NAMES + optional COMPONENTS | Kiriman Graph cocok template Meta; metadata DB (`rawMetadata` / preview) selaras dengan yang dikirim |

## Catatan integrasi

- Pastikan `web_id` di klien/session **sama string** dengan suffix yang Anda definisikan (case di normalisasi ke UPPER untuk env, bukan untuk nilai `web_id` di DB).
- Repo atau project lain yang **hanya** memakai secret global tidak perlu mengubah apa pun setelah merge kode ini.
