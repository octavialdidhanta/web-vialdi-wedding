/** Konten Syarat & Ketentuan (Bahasa Indonesia). Wajib ditinjau penasihat hukum sebelum dipakai sebagai kontrak mengikat. */

export const termsSeo = {
  title: "Syarat & Ketentuan — vialdi.id",
  description:
    "Syarat kerja sama agency: formulir & data, tanggung jawab klien dan agency, Meta Business Manager vs Ads Manager, serta ketentuan dana iklan. PT. Integrasi Visual Digital Indonesia (vialdi.id).",
} as const;

export const termsHero = {
  eyebrow: "Legal",
  title: "Syarat & Ketentuan",
  lead: "Ketentuan ini mengatur kerja sama layanan digital marketing antara klien dan vialdi.id (PT. Integrasi Visual Digital Indonesia), termasuk komunikasi, data, pembagian tanggung jawab, aset Meta, serta penggunaan budget iklan. Mohon baca seluruh bagian sebelum memulai kolaborasi.",
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
      "Dokumen ini (“Ketentuan”) berlaku bagi calon klien dan klien yang menggunakan situs vialdi.id, mengisi formulir, atau menandatangani perjanjian/penawaran layanan dengan kami (“Agency”, “kami”).",
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
    ],
  },
  {
    id: "kerjasama-agency",
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
    id: "meta-bm-ads-manager",
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
    id: "dana-iklan-pengembalian",
    title: "7. Dana pemasaran (ad spend) & pengembalian",
    paragraphs: [
      "Biaya fee layanan Agency dan dana iklan (ad spend) pada umumnya merupakan pos terpisah, kecuali disepakati lain secara tertulis.",
      "Dana yang telah dikeluarkan ke platform iklan (termasuk namun tidak terbatas pada Meta Ads, Google Ads, TikTok Ads, dan sejenisnya) menjadi bagian dari saldo/kredit di pihak platform dan telah digunakan sesuai pengaturan kampanye. Oleh karena itu, Agency tidak bertanggung jawab atas pengembalian (refund) atas budget marketing yang sudah dikeluarkan ke platform atau pihak ketiga, sejauh ketentuan platform dan hukum yang berlaku.",
      "Sengketa terkait penagihan, kredit iklan, atau kebijakan refund platform akan ditangani sesuai prosedur masing-masing penyedia layanan; Agency dapat membantu koordinasi administratif tanpa menjamin hasil outcome di pihak platform.",
    ],
  },
  {
    id: "penutup",
    title: "8. Perubahan ketentuan, hukum, & kontak",
    paragraphs: [
      "Kami dapat memperbarui Ketentuan ini; tanggal di bagian atas akan disesuaikan. Untuk perubahan yang mempengaruhi proyek berjalan, kami akan berupaya menginformasikan melalui saluran resmi.",
      "Ketentuan ini diatur oleh hukum Republik Indonesia. Untuk pertanyaan, hubungi kami melalui halaman kontak resmi atau alamat kantor di footer situs.",
    ],
  },
];
