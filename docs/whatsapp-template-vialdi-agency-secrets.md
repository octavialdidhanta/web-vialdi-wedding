# Secret override WhatsApp — agency (`web_id` = `vialdi`)

Template isi (ringkas): sapaan pakai nama, lalu **Nama**, **Bidang usaha**, **Jenis usaha**, **alamat**, **kebutuhan**, **Ringkasan kebutuhan** — setara **6** variabel body berurutan `{{1}}` … `{{6}}` di Meta.

**Skala banyak klien / tenant:** lebih aman menyimpan `template_name`, `body_keys`, dll. di tabel **`public.organization_whatsapp_templates`** (satu baris per `web_id` per organisasi) — nilai di DB **mengalahkan** secret `__VIALDI` untuk field yang diisi. Lihat prioritas lengkap di [`whatsapp-template-env-per-web-id.md`](whatsapp-template-env-per-web-id.md).

Di bawah ini tetap opsi **Edge Function Secrets** jika Anda tidak memakai baris DB.

Di Supabase → **Edge Function Secrets**, tambahkan (atau sesuaikan) baris berikut. **Nama template** wajib sama persis dengan yang tertera di WhatsApp Manager untuk template yang sudah **Approved** pada nomor/WABA pengiriman agency.

## Nilai siap tempel

| Name (secret key) | Value (isi kolom Value) |
|-------------------|-------------------------|
| `WHATSAPP_TEMPLATE_NAME__VIALDI` | **Ganti** dengan nama template Meta Anda, contoh: `vialdi_id_agency_lead` (huruf besar/kecil harus sama dengan di Meta). |
| `WHATSAPP_TEMPLATE_LANGUAGE__VIALDI` | Kode bahasa template di Meta — untuk template berbahasa Indonesia biasanya `id`. Jika kiriman gagal dengan error bahasa, buka template di Meta dan salin **Language** persis (mis. `en_US`). |
| `WHATSAPP_TEMPLATE_BODY_KEYS__VIALDI` | `name,industry,business_type,office_address,needs,ringkasan_kebutuhan` |

Urutan di atas mengikuti slot body:

1. `name` → `{{1}}` (dipakai di sapaan dan baris Nama)
2. `industry` → Bidang usaha
3. `business_type` → Jenis usaha
4. `office_address` → alamat
5. `needs` → kebutuhan
6. `ringkasan_kebutuhan` → Ringkasan kebutuhan

**Jangan** set `WHATSAPP_TEMPLATE_BODY_PARAMETER_NAMES__VIALDI` kecuali template Anda di Meta memakai **parameter body bernama** (bukan hanya `{{1}}`…`{{6}}`). Untuk template posisional klasik, biarkan kosong (tidak buat secret ini).

## Opsional

- `WHATSAPP_TEMPLATE_COMPONENTS_JSON__VIALDI` — hanya jika Anda memakai override komponen (header/button) khusus; biasanya tidak perlu untuk template ini.

## Setelah menyimpan secret

1. Deploy ulang Edge Functions **`wedding-package-lead`** dan **`contact-lead`** jika Anda baru menarik perubahan kode yang menambahkan field `ringkasan_kebutuhan` ke `ctx` template.
2. Uji kirim lead dari situs agency (`web_id` `vialdi`).
3. Jika Meta mengembalikan error parameter / bahasa, sesuaikan `WHATSAPP_TEMPLATE_LANGUAGE__VIALDI` atau jumlah urutan `BODY_KEYS` agar sama dengan template yang terdaftar.

## Catatan global vs override

Secret **tanpa** `__VIALDI` tetap dipakai untuk `web_id` lain (mis. wedding). Hanya traffic `vialdi` yang memakai override di atas.
