/** Konten Syarat & Ketentuan (Bahasa Indonesia). Wajib ditinjau penasihat hukum sebelum dipakai sebagai kontrak mengikat. */

import { isWeddingSite } from "@/site/siteVariant";

const termsSeoAgency = {
  title: "Syarat & Ketentuan — vialdi.id",
  description:
    "Ketentuan layanan digital marketing vialdi.id: komunikasi & data, kerja sama agency, tanggung jawab klien & agency, Meta Business Manager, ad spend, serta hukum & kontak. PT. Integrasi Visual Digital Indonesia.",
} as const;

const termsSeoWedding = {
  title: "Syarat & Ketentuan — Vialdi Wedding",
  description:
    "Syarat kerja sama layanan wedding organizer Vialdi Wedding: komunikasi & data, ruang lingkup, kewajiban pasangan dan organizer, vendor & aset kreatif, serta pembayaran, pemindaian tanggal, dan pembatalan. PT. Integrasi Visual Digital Indonesia.",
} as const;

export const termsSeo = isWeddingSite() ? termsSeoWedding : termsSeoAgency;

const termsHeroAgency = {
  eyebrow: "LEGAL",
  title: "Syarat & Ketentuan",
  lead: "Ketentuan ini mengatur kerja sama layanan digital marketing antara klien dan vialdi.id (PT. Integrasi Visual Digital Indonesia), termasuk komunikasi, data, pembagian tanggung jawab, aset Meta, serta penggunaan budget iklan. Mohon baca seluruh bagian sebelum memulai kolaborasi.",
  lastUpdated: "Terakhir diperbarui: April 2026",
} as const;

const termsHeroWedding = {
  eyebrow: "Ketentuan layanan",
  title: "Syarat & Ketentuan",
  lead: "Ketentuan ini mengatur penggunaan situs Vialdi Wedding, pengisian formulir, serta kerja sama layanan organisasi pernikahan antara pasangan/klien dan Vialdi Wedding (bagian dari PT. Integrasi Visual Digital Indonesia), termasuk komunikasi, data, pembagian tanggung jawab dengan vendor mitra, pembayaran, dan ketentuan perubahan atau pembatalan acara. Mohon baca seluruh bagian sebelum memulai kolaborasi.",
  lastUpdated: "Terakhir diperbarui: April 2026",
} as const;

export const termsHero = isWeddingSite() ? termsHeroWedding : termsHeroAgency;

export type TermsSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const termsSectionsAgency: TermsSection[] = [
  {
    id: "pengantar",
    title: "1. Pengantar",
    paragraphs: [
      'Dokumen ini (“Ketentuan”) berlaku bagi calon klien dan klien yang menggunakan situs vialdi.id, mengisi formulir, atau menandatangani perjanjian/penawaran layanan dengan kami (“Agency”, “kami”).',
      "Ketentuan ini melengkapi—bukan menggantikan—perjanjian tertulis (proposal, kontrak, SOW) yang disepakati kedua belah pihak. Bila terdapat pertentangan, dokumen perjanjian khusus yang lebih baru dan relevan mengenai proyek tersebut yang diutamakan.",
    ],
  },
  {
    id: "formulir-komunikasi-data",
    title: "2. Formulir, komunikasi, & data",
    paragraphs: [
      "Informasi yang Anda berikan melalui formulir di situs, email resmi, pesan aplikasi yang disepakati, atau kanal komunikasi lain yang diakui Agency digunakan untuk penilaian kebutuhan, administrasi penawaran, onboarding, pelaporan, dan penagihan sebagaimana relevan.",
      "Anda bertanggung jawab atas keakuratan data (nama entitas, kontak, akses akun sementara, materi brief, dan lainnya). Keterlambatan atau kesalahan eksekusi yang timbul dari data yang tidak lengkap, ambigu, atau tidak diperbarui oleh Klien menjadi risiko operasional Klien sejauh wajar.",
      "Kami memperlakukan data sensitif sesuai kebutuhan layanan dan peraturan perlindungan data yang berlaku. Akses internal dibatasi pada personel yang memerlukan untuk menjalankan scope kerja.",
      "Pada formulir kontak dan alur konsultasi paket berbasis formulir di situs vialdi.id, pengiriman data di langkah akhir hanya dapat dilakukan setelah Anda mencentang pernyataan persetujuan pemrosesan data. Dengan mencentang kotak tersebut, Anda menyatakan telah membaca bagian Ketentuan ini (minimal bagian formulir, komunikasi, & data) dan menyetujui pengumpulan serta pemrosesan data yang Anda kirimkan sejauh diperlukan untuk tujuan yang dijelaskan di atas, sampai Anda menarik persetujuan sejauh diizinkan hukum atau menghentikan komunikasi sesuai prosedur yang kami sediakan.",
      "Persetujuan yang diberikan melalui centang pada antarmuka situs bersifat elektronik dan dianggap memadai sebagai bukti persetujuan awal untuk keperluan operasional layanan, tanpa menggantikan perjanjian tertulis terpisah bila suatu layanan mensyaratkan kontrak khusus.",
    ],
  },
  {
    id: "kerjasama-dengan-agency",
    title: "3. Kerjasama dengan agency",
    paragraphs: [
      "Kerja sama dianggap dimulai setelah kesepakatan ruang lingkup, tarif/retainer, dan—jika dipersyaratkan—dokumen formal ditandatangani atau disetujui secara tertulis (termasuk persetujuan elektronik yang dapat diaudit).",
      "Perubahan scope di luar kesepakatan awal dapat memerlukan penyesuaian timeline dan biaya. Perubahan tersebut akan dibahas dan disepakati secara tertulis sebelum dieksekusi, kecuali situasi darurat operasional yang disepakati lain oleh kedua pihak.",
    ],
    bullets: [
      "Klien menyediakan titik kontak utama dan waktu respons yang wajar untuk persetujuan materi, akses, dan eskalasi.",
      "Agency menjadwalkan update rutin sesuai kesepakatan (misalnya call/laporan mingguan) dan mendokumentasikan rekomendasi berbasis data sejauh data tersedia.",
    ],
  },
  {
    id: "tanggung-jawab-klien",
    title: "4. Tanggung jawab klien",
    paragraphs: [
      "Klien bertanggung jawab atas legalitas produk/jasa, klaim pemasaran, izin industri (jika ada), serta kepatuhan terhadap kebijakan platform iklan dan pihak ketiga.",
    ],
    bullets: [
      "Menyediakan materi awal, brand guideline, dan persetujuan akhir untuk konten/kampanye sesuai SLA yang disepakati.",
      "Memastikan pihak yang memberi persetujuan berwenang secara internal (marketing, legal, manajemen).",
      "Memelihara keamanan kredensial yang diberikan kepada Agency dan segera memberitahu jika terjadi kebocoran atau perubahan personel.",
      "Membayar fee layanan dan alokasi dana iklan sesuai jadwal yang disepakati, termasuk pajak dan biaya pihak ketiga yang menjadi beban Klien menurut kontrak.",
    ],
  },
  {
    id: "tanggung-jawab-agency",
    title: "5. Tanggung jawab agency",
    paragraphs: [
      "Agency menjalankan pekerjaan profesional sesuai scope yang disepakati, dengan komunikasi proaktif terkait risiko, kendala teknis, dan rekomendasi optimasi.",
    ],
    bullets: [
      "Mengoperasikan, memonitor, dan melaporkan performa kanal yang menjadi tanggung jawab Agency berdasarkan data yang tersedia dari platform dan tracking yang disepakati.",
      "Mematuhi kebijakan platform (Meta, Google, TikTok, dll.) dalam batas akun dan izin yang diberikan Klien.",
      "Merahasiakan informasi bisnis Klien sejauh tidak bertentangan dengan kewajiban hukum atau permintaan resmi berwenang.",
    ],
  },
  {
    id: "meta-bm-ads-kepemilikan-aset",
    title: "6. Meta Business Manager, Ads Manager, & kepemilikan aset",
    paragraphs: [
      "Untuk kebutuhan integrasi iklan Meta (Facebook/Instagram), pengaturan umum yang disepakati adalah sebagai berikut, kecuali ditulis lain dalam kontrak proyek:",
    ],
    bullets: [
      "Meta Business Manager (BM): kepemilikan dan struktur utama BM berada pada pihak Klien. Akses yang diberikan kepada Agency bersifat sementara dan semata-mata untuk pelaksanaan layanan (misalnya peran partner/agency pada aset yang relevan), serta dapat dicabut setelah masa kerja sama berakhir sesuai prosedur yang disepakati.",
      "Ads Manager & struktur kampanye yang dioperasikan Agency dalam rangka layanan: pengelolaan teknis dan optimasi dilakukan oleh Agency dalam batas akun dan izin yang diberikan Klien. Hak kepemilikan akun tetap mengikuti kebijakan Meta dan kesepakatan tertulis antara Klien dan Agency (termasuk transfer/hapus aset setelah offboarding).",
      "Klien tetap bertanggung jawab atas kepatuhan bisnis pada kebijakan Meta; Agency tidak menjamin hasil tertentu (misalnya volume lead tetap) karena banyak variabel di luar kendali Agency.",
    ],
  },
  {
    id: "dana-pemasaran-ad-spend",
    title: "7. Dana pemasaran (ad spend) & pengembalian",
    paragraphs: [
      "Biaya fee layanan Agency dan dana iklan (ad spend) pada umumnya merupakan pos terpisah, kecuali disepakati lain secara tertulis.",
      "Dana yang telah dikeluarkan ke platform iklan (termasuk namun tidak terbatas pada Meta Ads, Google Ads, TikTok Ads, dan sejenisnya) menjadi bagian dari saldo/kredit di pihak platform dan telah digunakan sesuai pengaturan kampanye. Oleh karena itu, Agency tidak bertanggung jawab atas pengembalian (refund) atas budget marketing yang sudah dikeluarkan ke platform atau pihak ketiga, sejauh ketentuan platform dan hukum yang berlaku.",
      "Sengketa terkait penagihan, kredit iklan, atau kebijakan refund platform akan ditangani sesuai prosedur masing-masing penyedia layanan; Agency dapat membantu koordinasi administratif tanpa menjamin hasil outcome di pihak platform.",
    ],
  },
  {
    id: "perubahan-ketentuan-hukum-kontak",
    title: "8. Perubahan ketentuan, hukum, & kontak",
    paragraphs: [
      "Kami dapat memperbarui Ketentuan ini; tanggal di bagian atas akan disesuaikan. Untuk perubahan yang mempengaruhi proyek berjalan, kami akan berupaya menginformasikan melalui saluran resmi.",
      "Ketentuan ini diatur oleh hukum Republik Indonesia. Untuk pertanyaan, hubungi kami melalui halaman kontak resmi atau alamat kantor di footer situs.",
    ],
  },
];

const termsSectionsWedding: TermsSection[] = [
  {
    id: "pengantar",
    title: "1. Pengantar",
    paragraphs: [
      "Dokumen ini (“Ketentuan”) berlaku bagi pengunjung situs, calon klien, dan klien yang menggunakan layanan Vialdi Wedding, mengisi formulir, atau menandatangani/menyetujui penawaran, perjanjian, atau ruang lingkup kerja (“SOW”) terkait organisasi pernikahan.",
      "Ketentuan ini melengkapi—bukan menggantikan—perjanjian tertulis (proposal, kontrak, SOW) yang disepakati kedua belah pihak. Bila terdapat pertentangan, dokumen perjanjian khusus yang lebih baru dan relevan mengenai acara tersebut yang diutamakan.",
    ],
  },
  {
    id: "formulir-komunikasi-data",
    title: "2. Formulir, komunikasi, & data",
    paragraphs: [
      "Informasi yang Anda berikan melalui formulir di situs, email resmi, pesan aplikasi yang disepakati, atau kanal komunikasi lain yang diakui Vialdi Wedding digunakan untuk penilaian kebutuhan, penyusunan penawaran, perencanaan acara, koordinasi vendor, administrasi, dan penagihan sebagaimana relevan.",
      "Anda bertanggung jawab atas keakuratan data (nama pasangan, kontak, tanggal/venue, estimasi tamu, alergi makanan bila relevan, materi brief, dan lainnya). Keterlambatan atau dampak operasional yang timbul dari data yang tidak lengkap, ambigu, atau tidak diperbarui oleh klien menjadi risiko klien sejauh wajar.",
      "Kami memperlakukan data pribadi sesuai kebutuhan layanan dan peraturan perlindungan data yang berlaku. Akses internal dibatasi pada personel yang memerlukan untuk menjalankan ruang lingkup kerja.",
    ],
  },
  {
    id: "lingkup-layanan",
    title: "3. Ruang lingkup kerja sama",
    paragraphs: [
      "Kerja sama layanan organisasi pernikahan dianggap dimulai setelah kesepakatan ruang lingkup, paket/tarif, dan—jika dipersyaratkan—dokumen formal ditandatangani atau disetujui secara tertulis (termasuk persetujuan elektronik yang dapat diaudit).",
      "Perubahan ruang lingkup di luar kesepakatan awal (misalnya penambahan hari acara, perubahan venue besar, penambahan jumlah vendor di luar daftar awal) dapat memerlukan penyesuaian timeline dan biaya. Perubahan tersebut akan dibahas dan disepakati secara tertulis sebelum dieksekusi, kecuali situasi mendesak di venue yang disepakati lain oleh kedua pihak pada saat itu.",
    ],
    bullets: [
      "Klien menyediakan titik kontak utama dan waktu respons yang wajar untuk persetujuan konsep, vendor, rundown, dan eskalasi keputusan.",
      "Vialdi Wedding menyampaikan update perencanaan sesuai kesepakatan (misalnya rapat/komunikasi berkala) dan mendokumentasikan keputusan penting agar semua pihak memiliki referensi yang sama.",
    ],
  },
  {
    id: "tanggung-jawab-klien",
    title: "4. Tanggung jawab pasangan (klien)",
    paragraphs: [
      "Klien bertanggung jawab atas legalitas pernikahan menurut hukum dan agama yang berlaku (dokumen civil/registry, dispensasi, atau persyaratan institusi lain) sejauh hal tersebut berada di luar ruang lingkup organizer, kecuali disepakati lain secara tertulis.",
      "Klien bertanggung jawab atas kebenaran informasi yang diberikan kepada tamu (alamat, waktu, dress code) dan atas izin penggunaan venue sesuai peraturan pemilik venue.",
    ],
    bullets: [
      "Menyediakan materi yang diperlukan untuk produksi (referensi mood board, daftar tamu bila relevan, teks undangan) dan persetujuan akhir sesuai tenggat yang disepakati.",
      "Memastikan pihak yang memberi persetujuan berwenang secara internal (pasangan, orang tua/wali, atau perwakilan yang disahkan).",
      "Memelihara keamanan kredensial yang diberikan kepada tim Vialdi Wedding (akun undangan, drive bersama, dll.) dan segera memberitahu jika terjadi perubahan personel atau kebocoran akses.",
      "Memenuhi jadwal pembayaran fee layanan organizer dan—jika diatur dalam kontrak—komponen lain yang menjadi kewajiban klien, termasuk pajak dan biaya pihak ketiga yang menjadi beban klien menurut perjanjian.",
    ],
  },
  {
    id: "tanggung-jawab-organizer",
    title: "5. Tanggung jawab Vialdi Wedding",
    paragraphs: [
      "Vialdi Wedding menjalankan pekerjaan koordinasi dan pendampingan profesional sesuai ruang lingkup yang disepakati, dengan komunikasi proaktif terkait risiko logistik, kendala venue, dan opsi mitigasi yang wajar.",
      "Kinerja vendor independen (misalnya catering, dekor, fotografer mitra) mengikuti kontrak dan kualitas layanan masing-masing vendor; Vialdi Wedding membantu komunikasi dan penyelarasan jadwal, namun tidak menggantikan garansi atau klaim langsung kepada vendor kecuali disepakati lain secara tertulis.",
    ],
    bullets: [
      "Menyusun dan memperbarui rundown kerja serta titik koordinasi utama di hari-H sesuai kesepakatan terakhir yang disetujui klien.",
      "Mematuhi peraturan venue dan kebijakan keselamatan umum dalam membimbing tim lapangan dan komunikasi dengan vendor.",
      "Merahasiakan informasi pribadi dan detail acara klien sejauh tidak bertentangan dengan kewajiban hukum atau permintaan resmi berwenang.",
    ],
  },
  {
    id: "vendor-dokumentasi-dan-publikasi",
    title: "6. Vendor mitra, dokumentasi, & penggunaan materi",
    paragraphs: [
      "Untuk kejelasan hak dan kewajiban terkait vendor serta aset visual, pengaturan umum yang disepakati adalah sebagai berikut, kecuali ditulis lain dalam kontrak proyek:",
    ],
    bullets: [
      "Kontrak layanan langsung dengan vendor (harga final, revisi, pengiriman barang) pada umumnya dijalin antara klien dan vendor, dengan Vialdi Wedding berperan sebagai koordinator sesuai SOW. Jika ada skema khusus (bundling/pembayaran melalui organizer), akan dijelaskan secara terpisah di perjanjian.",
      "Dokumentasi foto/video: penggunaan materi untuk portofolio, promosi, atau media sosial Vialdi Wedding mengikuti persetujuan tertulis klien (model rilis/izin) sebagaimana dicantumkan dalam kontrak atau formulir persetujuan terpisah.",
      "Klien bertanggung jawab atas lisensi musik, konten tayangan, atau materi pihak ketiga yang ditayangkan di acara, sejauh di luar paket yang secara eksplisit menjadi tanggung jawab Vialdi Wedding.",
    ],
  },
  {
    id: "pembayaran-pemindaian-pembatalan",
    title: "7. Pembayaran, pemindaian tanggal, & pembatalan",
    paragraphs: [
      "Struktur pembayaran (uang muka, termin, pelunasan) mengikuti penawaran/kontrak yang berlaku. Keterlambatan pembayaran dapat mempengaruhi penjadwalan vendor atau lock jadwal tim internal.",
      "Pemindaian tanggal acara mengikuti ketersediaan jadwal, kebijakan vendor, dan biaya tambahan yang mungkin timbul; setiap permintaan perubahan akan dibahas secara tertulis.",
      "Pembatalan oleh klien: konsekuensi finansial (pengembalian sebagian atau tidak ada pengembalian) mengikuti ketentuan dalam kontrak dan jarak waktu ke hari-H, serta kebijakan vendor yang sudah mengunci slot atau memproduksi barang.",
      "Keadaan memaksa (force majeure) seperti bencana alam, kebijakan pemerintah yang langsung mempengaruhi acara, atau kejadian di luar kendali wajar pihak manapun akan ditangani melalui musyawarah untuk solusi terbaik, dengan memperhatikan biaya yang sudah terlanjur dikeluarkan.",
    ],
  },
  {
    id: "penutup",
    title: "8. Perubahan ketentuan, hukum, & kontak",
    paragraphs: [
      "Kami dapat memperbarui Ketentuan ini; tanggal di bagian atas akan disesuaikan. Untuk perubahan yang mempengaruhi acara yang sedang berjalan, kami akan berupaya menginformasikan melalui saluran resmi.",
      "Ketentuan ini diatur oleh hukum Republik Indonesia. Untuk pertanyaan, hubungi kami melalui halaman kontak resmi atau informasi kontak di footer situs.",
    ],
  },
];

export const termsSections: TermsSection[] = isWeddingSite() ? termsSectionsWedding : termsSectionsAgency;

const termsFooterAgency = {
  entityLine: "PT. Integrasi Visual Digital Indonesia — vialdi.id",
} as const;

const termsFooterWedding = {
  entityLine: "PT. Integrasi Visual Digital Indonesia — merek layanan: Vialdi Wedding",
} as const;

export const termsFooter = isWeddingSite() ? termsFooterWedding : termsFooterAgency;
