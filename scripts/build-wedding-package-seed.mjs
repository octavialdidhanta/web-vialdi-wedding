/**
 * Generates supabase/migrations/20260422100100_wedding_packages_seed.sql
 * Run from repo root: node scripts/build-wedding-package-seed.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROMO_END_ISO = "2026-06-29T16:59:59.000Z";

const ROWS = [
  {
    id: "11111111-1111-4111-8111-000000000001",
    slug: "royal_wedding_gold",
    sort_order: 0,
    badge_label: "Foto & video",
    title: "Royal Wedding Gold Premium + Album + Tim Profesional Ekstra",
    package_label: "Royal Wedding Gold Premium + Album + Tim Profesional Ekstra",
    strikethrough_price: "Rp 7.900.000",
    price: "Rp 5.500.000",
    promo_marquee_text:
      "Cocok untuk resepsi di hotel & gedung — alur jelas, tim lengkap, hasil rapi. CLIENT PRIORITAS (HASIL FOTO DI TERIMA DALAM 3 HARI), paket ini paling banyak dipilih.",
    footer_note:
      "Total bonus mengikuti promo periode pemesanan. Detail pasti kami jelaskan saat konsultasi gratis.",
    footer_extra_html: null,
    show_best_seller: false,
    best_seller_image_path: null,
    best_seller_image_url: null,
    badge_image_path: null,
    badge_image_url: null,
    promo_countdown_ends_at: null,
    footer_countdown_label: null,
    show_footer_countdown: false,
    sections: [
      {
        id: "photo",
        title: "Foto",
        intro:
          "Abadikan momen spesial Anda dengan tim ahli: dua fotografer profesional dan peralatan studio lengkap.",
        bullets: [
          "1 fotografer utama + 1 fotografer candid",
          "2 kamera profesional + lighting, flash, umbrella, tripod",
          "Sesi dokumentasi hingga 6 jam (sesuai paket)",
          "200 foto diedit + file dikirim via Google Drive & flashdisk",
          "Estimasi hasil foto utama 3 hari setelah acara untuk klien prioritas",
        ],
      },
      {
        id: "video",
        title: "Video sinematik",
        intro: "Cerita hari H dalam format film pendek yang emosional dan layak ditonton ulang.",
        bullets: [
          "1 videografer sinematik profesional",
          "1 kamera + tripod + gimbal stabilizer",
          "Highlight cinematic 2–5 menit (detail mengikuti paket)",
        ],
      },
      {
        id: "album",
        title: "Album kolase",
        intro: "Kenang momen terbaik dalam album yang awet dan enak dipegang.",
        bullets: ["1 album kolase / foto laminasi doff 22 halaman (sesuai spesifikasi paket)"],
      },
      {
        id: "bonus",
        title: "Bonus",
        intro: "Nilai tambah agar kenangan Anda lebih lengkap dan praktis.",
        bullets: [
          "Cinematic highlight ±30 detik untuk feed Instagram",
          "Cetak foto 4R + frame standar (sesuai promo berlaku)",
          "Flashdisk berisi master & hasil edit (sesuai promo berlaku)",
          "Ongkir pengiriman paket (sesuai promo & area)",
        ],
      },
      {
        id: "extra",
        title: "Extra bonus",
        intro: "Untuk paket tertentu — lebih banyak waktu, lebih banyak cerita.",
        bullets: ["Bonus tambahan durasi pemotretan +2 jam (mengikuti syarat paket)"],
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000002",
    slug: "wedding_gold_premium",
    sort_order: 1,
    badge_label: "Foto & video",
    title: "Wedding Gold Premium + Album Foto",
    package_label: "Wedding Gold Premium + Album Foto",
    strikethrough_price: "Rp 6.900.000",
    price: "Rp 5.100.000",
    promo_marquee_text: "Cocok untuk acara di Hotel & Gedung",
    footer_note: "Total Bonus Gratis yang kamu dapat Senilai Rp 500.000",
    footer_extra_html: null,
    show_best_seller: false,
    best_seller_image_path: null,
    best_seller_image_url: null,
    badge_image_path: null,
    badge_image_url: null,
    promo_countdown_ends_at: PROMO_END_ISO,
    footer_countdown_label: "Promo Berakhir Dalam",
    show_footer_countdown: true,
    sections: [
      {
        id: "g-photo",
        title: "Photo",
        intro:
          "Paket ini dilayani oleh 1 orang Fotografer Profesional dan menggunakan 1 kamera Profesional.",
        bullets: [
          "1 Fotografer (dilayani oleh Fotografer Profesional)",
          "2 Kamera Profesional (Sony A7Riii)",
          "Peralatan Pendukung (Flash + Full Set Lighting + Umbrella + Tripod + Stabilizer)",
          "Unlimited Photoshoot (File dikirim via Gdrive + FD)",
          "200 Foto di Edit",
          "Hasil akan di terima dalam 3 hari setelah acara selesai",
          "6 Jam Sesi Pemotretan",
        ],
      },
      {
        id: "g-video",
        title: "Cinematic Video",
        intro: null,
        bullets: [
          "1 Cinematic Videographer",
          "1 Kamera + Peralatan Tripod + Gimbal (Stabilizer)",
          "Video Cinematic/ Cinematic Movie (Durasi 2-5 Menit)",
        ],
      },
      {
        id: "g-album",
        title: "Album Kolase",
        intro: null,
        bullets: ["1 Album Kolase / Album Foto Laminating Semidoff 22 Halaman"],
      },
      {
        id: "g-bonus",
        title: "Bonus",
        intro: null,
        bonus_lines: [
          { text: "Cinematic Video Highlight Feed IG (Durasi 30 Detik)", struck: true },
          {
            text: "Gratis 3x Cetak Foto 4R + 3 Frame / Bingkai Foto 4R Standard Senilai 200.000",
            struck: false,
          },
          {
            text: "Gratis 1 Flashdisk 8 GB Berisi Master Foto Asli + Yang Sudah di Edit Senilai Rp 200.000",
            struck: false,
          },
          {
            text: "Gratis Ongkos Kirim Paket ke Alamat senilai Rp 100.000",
            struck: false,
          },
        ],
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000003",
    slug: "wedding_super_junior",
    sort_order: 2,
    badge_label: "Foto & video",
    title: "Paket Wedding Super Junior",
    package_label: "Paket Wedding Super Junior",
    strikethrough_price: "Rp 4.000.000",
    price: "Rp 3.500.000",
    promo_marquee_text:
      "Cocok untuk acara di Rumah & Restaurant/ Gedung — Paket ini paling banyak diminati.",
    footer_note: "Total Bonus Gratis yang kamu dapat Senilai Rp 350.000",
    footer_extra_html: null,
    show_best_seller: false,
    best_seller_image_path: null,
    best_seller_image_url: null,
    badge_image_path: null,
    badge_image_url: null,
    promo_countdown_ends_at: PROMO_END_ISO,
    footer_countdown_label: "Promo Berakhir Dalam",
    show_footer_countdown: true,
    sections: [
      {
        id: "sj-photo",
        title: "Photo",
        intro:
          "Paket ini dilayani oleh 1 orang Fotografer Junior dan menggunakan 1 kamera Standard photography.",
        bullets: [
          "1 Photographer Junior",
          "1 Kamera (Canon 80D)",
          "Peralatan Pendukung (Flash + Full Set Lighting + Umbrella + Tripod + Stabilizer)",
          "Unlimited Photoshoot (File dikirim via Gdrive + FD)",
          "100 Foto di Edit",
          "Full Sesi Pemotretan (Sampai Selesai Acara)",
          "Hasil akan di terima dalam 14 - 21 hari Kerja setelah acara selesai.",
        ],
      },
      {
        id: "sj-video",
        title: "Cinematic Video",
        intro:
          "Paket ini dilayani oleh 1 orang Videografer Junior dan menggunakan 1 kamera Standard photography.",
        bullets: [
          "1 Videographer Junior",
          "1 Kamera + Peralatan Tripod + Gimbal (Stabilizer)",
          "Hasil Liputan Video Dokumentasi Acara yang sudah di edit (bukan video cinematic)",
        ],
      },
      {
        id: "sj-album",
        title: "Album Kolase",
        intro: null,
        bullets: ["1 Album Kolase Standard 22 Halaman"],
      },
      {
        id: "sj-bonus",
        title: "Bonus",
        intro: null,
        bullet_items: [
          { text: "Cinematic Video Highlight Feed IG (Durasi 30 Detik)", struck: true },
          { text: "Gratis 3x Cetak Foto 4R Senilai Rp. 50.000", struck: false },
          {
            text: "Gratis Flashdisk 8 GB Berisi Master Foto Asli + Yang Sudah di Edit Senilai Rp 200.000",
            struck: false,
          },
          { text: "Gratis Ongkos Kirim Paket ke Alamat senilai Rp 100.000", struck: false },
        ],
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000004",
    slug: "royal_platinum_foto_only",
    sort_order: 3,
    badge_label: "Foto only",
    title: "Royal Wedding Platinum + Album Foto",
    package_label: "Royal Wedding Platinum + Album Foto",
    strikethrough_price: "Rp 4.500.000",
    price: "Rp 3.500.000",
    promo_marquee_text:
      "Cocok untuk acara di Hotel & Gedung. CLIENT PRIORITAS (HASIL FOTO DI TERIMA DALAM 3 HARI), paket ini paling banyak diminati.",
    footer_note: "Total Bonus Gratis yang kamu dapat Senilai Rp 500.000",
    footer_extra_html: null,
    show_best_seller: false,
    best_seller_image_path: null,
    best_seller_image_url: null,
    badge_image_path: null,
    badge_image_url: null,
    promo_countdown_ends_at: null,
    footer_countdown_label: null,
    show_footer_countdown: false,
    sections: [
      {
        id: "pl-photo",
        title: "Photo",
        intro:
          "Paket ini dilayani oleh 2 orang Fotografer Profesional dan menggunakan 2 kamera Profesional.",
        bullets: [
          "1 Photografer utama + 1 Photografer Candid",
          "2 Kamera Profesional (Sony A7Riii)",
          "Peralatan Pendukung (Flash + Full Set Lighting + Umbrella + Tripod)",
          "Unlimited Photoshoot (File dikirim via Gdrive + FD)",
          "200 Foto di Edit",
          "6 Jam Sesi Pemotretan",
          "Hasil akan di terima dalam 3 hari setelah acara selesai.",
        ],
      },
      {
        id: "pl-album",
        title: "Album Kolase",
        intro: null,
        bullets: ["1 Album Kolase / Album Foto Laminating Semidoff 22 Halaman"],
      },
      {
        id: "pl-bonus",
        title: "Bonus",
        intro: null,
        bullets: [
          "Gratis 3x Cetak Foto 4R + 3 Frame / Bingkai Foto 4R Standard Senilai 150.000",
          "Gratis 1 Flashdisk 16 GB Berisi Master Foto Asli + Yang Sudah di Edit Senilai Rp 200.000",
          "Gratis Ongkos Kirim Paket ke Alamat senilai Rp 100.000",
        ],
      },
      {
        id: "pl-extra",
        title: "Extra Bonus",
        intro: null,
        bullets: ["Bonus tambahan 2 jam durasi foto."],
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000005",
    slug: "wedding_platinum_album",
    sort_order: 4,
    badge_label: "> Foto only",
    title: "Wedding Platinum + Album Foto",
    package_label: "Wedding Platinum + Album Foto",
    strikethrough_price: "Rp 4.500.000",
    price: "Rp 3.000.000",
    promo_marquee_text: "Cocok untuk acara di Hotel & Gedung",
    footer_note: "Total Bonus Gratis yang kamu dapat Senilai Rp 500.000",
    footer_extra_html: null,
    show_best_seller: false,
    best_seller_image_path: null,
    best_seller_image_url: null,
    badge_image_path: null,
    badge_image_url: null,
    promo_countdown_ends_at: PROMO_END_ISO,
    footer_countdown_label: "Promo Berakhir Dalam",
    show_footer_countdown: true,
    sections: [
      {
        id: "wp-photo",
        title: "Photo",
        intro:
          "Paket ini dilayani oleh 1 orang Fotografer Profesional dan menggunakan 1 kamera Profesional.",
        bullets: [
          "1 Photographer Profesional",
          "1 Kamera Profesional (Sony A7Riii)",
          "Peralatan Pendukung (Flash + Full Set Lighting + Umbrella + Tripod)",
          "Unlimited Photoshoot (File dikirim via Gdrive + FD)",
          "100 Foto di Edit",
          "6 Jam Sesi Pemotretan",
        ],
      },
      {
        id: "wp-album",
        title: "Album Kolase",
        intro: null,
        bullets: ["1 Album Kolase / Album Foto Laminating Semidoff 22 Halaman"],
      },
      {
        id: "wp-bonus",
        title: "Bonus",
        intro: null,
        bullets: [
          "Gratis 3x Cetak Foto 4R + 3 Frame / Bingkai Foto 4R Standard Senilai 200.000",
          "Gratis 1 Flashdisk 16 GB Berisi Master Foto Asli + Yang Sudah di Edit Senilai Rp 200.000",
          "Gratis Ongkos Kirim Paket ke Alamat senilai Rp 100.000",
        ],
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000006",
    slug: "wedding_junior",
    sort_order: 5,
    badge_label: "> Foto only",
    title: "Paket Wedding Junior",
    package_label: "Paket Wedding Junior",
    strikethrough_price: "Rp 1.750.000",
    price: "Rp 1.500.000",
    promo_marquee_text: "Cocok untuk acara di Rumah & Restaurant",
    footer_note: null,
    footer_extra_html: null,
    show_best_seller: false,
    best_seller_image_path: null,
    best_seller_image_url: null,
    badge_image_path: null,
    badge_image_url: null,
    promo_countdown_ends_at: PROMO_END_ISO,
    footer_countdown_label: "Promo Berakhir Dalam",
    show_footer_countdown: true,
    sections: [
      {
        id: "wj-photo",
        title: "Photo",
        intro:
          "Paket ini dilayani oleh 1 orang Fotografer Junior dan menggunakan 1 kamera Standard photography.",
        bullets: [
          "1 Photographer Junior",
          "1 Kamera (Canon 80D)",
          "Flash",
          "Unlimited Photoshoot (File dikirim via Gdrive)",
          "30 Foto di Edit",
          "Full Sesi Pemotretan (Sampai Selesai Acara)",
        ],
      },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000007",
    slug: "akad_nikah_spesial",
    sort_order: 6,
    badge_label: "> Foto only",
    title: "Akad Nikah Spesial Promo",
    package_label: "Akad Nikah Spesial Promo",
    strikethrough_price: "Rp 1.750.000",
    price: "Rp 1.500.000",
    promo_marquee_text: "Cocok untuk acara di Hotel & Gedung",
    footer_note: null,
    footer_extra_html: null,
    show_best_seller: false,
    best_seller_image_path: null,
    best_seller_image_url: null,
    badge_image_path: null,
    badge_image_url: null,
    promo_countdown_ends_at: PROMO_END_ISO,
    footer_countdown_label: "Promo Berakhir Dalam",
    show_footer_countdown: true,
    sections: [
      {
        id: "an-photo",
        title: "Photo",
        intro:
          "Paket ini dilayani oleh 1 orang Fotografer Profesional dan menggunakan 1 kamera Profesional.",
        bullets: [
          "1 Photographer Profesional",
          "1 Kamera (Sony a7Riii)",
          "Flash",
          "Unlimited Photoshoot (File dikirim via Gdrive)",
          "30 Foto di Edit",
          "2 Jam Sesi Pemotretan",
        ],
      },
    ],
  },
];

function dollarQuoteJson(obj) {
  const raw = JSON.stringify(obj);
  let tag = "pkg";
  while (raw.includes(`$${tag}$`)) {
    tag += "x";
  }
  return `$${tag}$${raw}$${tag}$::jsonb`;
}

function sqlStr(v) {
  if (v === null || v === undefined) return "null";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function sqlBool(b) {
  return b ? "true" : "false";
}

let sql = `-- Generated by scripts/build-wedding-package-seed.mjs\n`;
sql += `insert into public.wedding_packages (\n`;
sql += `  id, slug, sort_order, is_published, badge_label, title, package_label,\n`;
sql += `  strikethrough_price, price, promo_marquee_text, footer_note, footer_extra_html,\n`;
sql += `  show_best_seller, best_seller_image_path, best_seller_image_url, badge_image_path, badge_image_url,\n`;
sql += `  promo_countdown_ends_at, footer_countdown_label, show_footer_countdown, sections\n`;
sql += `) values\n`;

const lines = ROWS.map((r) => {
  return `  (
  '${r.id}'::uuid,
  ${sqlStr(r.slug)},
  ${r.sort_order},
  true,
  ${sqlStr(r.badge_label)},
  ${sqlStr(r.title)},
  ${sqlStr(r.package_label)},
  ${sqlStr(r.strikethrough_price)},
  ${sqlStr(r.price)},
  ${sqlStr(r.promo_marquee_text)},
  ${sqlStr(r.footer_note)},
  ${sqlStr(r.footer_extra_html)},
  ${sqlBool(r.show_best_seller)},
  ${sqlStr(r.best_seller_image_path)},
  ${sqlStr(r.best_seller_image_url)},
  ${sqlStr(r.badge_image_path)},
  ${sqlStr(r.badge_image_url)},
  ${r.promo_countdown_ends_at ? `'${r.promo_countdown_ends_at}'::timestamptz` : "null"},
  ${sqlStr(r.footer_countdown_label)},
  ${sqlBool(r.show_footer_countdown)},
  ${dollarQuoteJson(r.sections)}
)`;
});

sql += lines.join(",\n");
sql += `\non conflict (id) do update set\n`;
sql += `  slug = excluded.slug,\n`;
sql += `  sort_order = excluded.sort_order,\n`;
sql += `  is_published = excluded.is_published,\n`;
sql += `  badge_label = excluded.badge_label,\n`;
sql += `  title = excluded.title,\n`;
sql += `  package_label = excluded.package_label,\n`;
sql += `  strikethrough_price = excluded.strikethrough_price,\n`;
sql += `  price = excluded.price,\n`;
sql += `  promo_marquee_text = excluded.promo_marquee_text,\n`;
sql += `  footer_note = excluded.footer_note,\n`;
sql += `  footer_extra_html = excluded.footer_extra_html,\n`;
sql += `  show_best_seller = excluded.show_best_seller,\n`;
sql += `  best_seller_image_path = excluded.best_seller_image_path,\n`;
sql += `  best_seller_image_url = excluded.best_seller_image_url,\n`;
sql += `  badge_image_path = excluded.badge_image_path,\n`;
sql += `  badge_image_url = excluded.badge_image_url,\n`;
sql += `  promo_countdown_ends_at = excluded.promo_countdown_ends_at,\n`;
sql += `  footer_countdown_label = excluded.footer_countdown_label,\n`;
sql += `  show_footer_countdown = excluded.show_footer_countdown,\n`;
sql += `  sections = excluded.sections,\n`;
sql += `  updated_at = now();\n`;

const outPath = join(dirname(fileURLToPath(import.meta.url)), "../supabase/migrations/20260422100100_wedding_packages_seed.sql");
writeFileSync(outPath, sql, "utf8");
console.log("Wrote", outPath);
