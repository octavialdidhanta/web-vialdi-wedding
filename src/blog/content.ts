/** Copy halaman blog indeks & label terkait artikel (Vialdi.ID). */

export const blogIndexSeo = {
  title: "Blog — Vialdi.ID | Insight pemasaran digital & studi kasus",
  description:
    "Artikel singkat tentang strategi brand, iklan berbayar, konten, dan pengukuran performa — untuk tim pemasaran dan pemilik bisnis.",
} as const;

export const blogHero = {
  eyebrow: "Jurnal Vialdi.ID",
  title: "Insight praktis untuk pertumbuhan bisnis Anda",
  subtitle:
    "Dari framework strategi hingga eksekusi kampanye — kami rangkum pembelajaran lapangan agar Anda bisa mengambil keputusan lebih cepat.",
} as const;

export const blogFeatured = {
  heading: "Sorotan editor",
  badge: "Pilihan tim",
} as const;

export const blogList = {
  allArticlesHeading: "Semua artikel",
} as const;

export const blogEmpty = {
  title: "Tidak ada artikel yang cocok",
  hint: "Coba ubah kata kunci atau hapus filter topik.",
  resetLabel: "Tampilkan semua artikel",
} as const;

export const blogSearch = {
  placeholder: "Cari judul, ringkasan, atau topik…",
  ariaLabel: "Cari artikel blog",
} as const;

export const blogCta = {
  title: "Butuh pendampingan eksekusi pemasaran?",
  subtitle:
    "Ceritakan target bisnis dan saluran yang ingin Anda perkuat — tim Vialdi.ID membantu merancang langkah terukur dari strategi hingga optimasi.",
  buttonLabel: "Hubungi kami",
} as const;

export const blogPostMeta = {
  documentTitle: (postTitle: string) => `${postTitle} — Blog Vialdi.ID`,
  notFoundDocumentTitle: "Artikel tidak ditemukan — Vialdi.ID",
  notFoundDescription: "Artikel tidak ditemukan atau tautan sudah tidak berlaku.",
} as const;

export const blogPostUi = {
  loadErrorHeading: "Tidak dapat memuat artikel",
  backToBlogShort: "Kembali ke blog",
  notFoundHeading: "Artikel tidak ditemukan",
  notFoundSlugHint: "Periksa penulisan tautan atau kembali ke daftar artikel.",
  backToBlog: "Kembali ke daftar artikel",
  relatedEmpty: "Belum ada artikel terkait untuk ditampilkan.",
  allPostsLink: "Lihat semua artikel",
  contactCta: "Hubungi Vialdi.ID",
} as const;
