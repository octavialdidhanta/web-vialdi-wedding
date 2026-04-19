/** Konten Syarat & Ketentuan (Bahasa Indonesia). Wajib ditinjau penasihat hukum sebelum dipakai sebagai kontrak mengikat. */

export const termsSeo = {
  title: "Syarat & Ketentuan — Vialdi Wedding",
  description:
    "Syarat kerja sama layanan wedding organizer Vialdi Wedding: komunikasi & data, ruang lingkup, kewajiban pasangan dan organizer, vendor & aset kreatif, serta pembayaran, pemindaian tanggal, dan pembatalan. PT. Integrasi Visual Digital Indonesia.",
} as const;

export const termsHero = {
  eyebrow: "Ketentuan layanan",
  title: "Syarat & Ketentuan",
  lead: "Ketentuan ini mengatur penggunaan situs Vialdi Wedding, pengisian formulir, serta kerja sama layanan organisasi pernikahan antara pasangan/klien dan Vialdi Wedding (bagian dari PT. Integrasi Visual Digital Indonesia), termasuk komunikasi, data, pembagian tanggung jawab dengan vendor mitra, pembayaran, dan ketentuan perubahan atau pembatalan acara. Mohon baca seluruh bagian sebelum memulai kolaborasi.",
  lastUpdated: "Terakhir diperbarui: April 2026",
} as const;

export type TermsSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const termsSections: TermsSection[] = [
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

export const termsFooter = {
  entityLine: "PT. Integrasi Visual Digital Indonesia — merek layanan: Vialdi Wedding",
} as const;
