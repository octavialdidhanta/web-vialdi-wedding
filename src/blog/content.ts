/** Copy halaman blog indeks & label terkait artikel (Vialdi Wedding). */

export const blogIndexSeo = {
  title: "Blog — Vialdi Wedding | Inspirasi & tips persiapan nikah",
  description:
    "Kumpulan artikel singkat seputar persiapan pernikahan: checklist, timeline, dekorasi, rias, vendor, serta tips foto & video agar momenmu rapi dan berkesan.",
} as const;

export const blogHero = {
  eyebrow: "Jurnal Vialdi Wedding",
  title: "Inspirasi & panduan singkat untuk hari pernikahanmu",
  subtitle:
    "Dari checklist sampai tips dokumentasi — kami rangkum hal yang paling sering ditanya calon pengantin agar persiapan lebih tenang dan terarah.",
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
  title: "Mau konsultasi persiapan & paket Vialdi Wedding?",
  subtitle:
    "Ceritakan tanggal acara, kebutuhan (WO/dekor/rias/dokumentasi), dan preferensi budget — tim kami bantu rekomendasi paket yang paling pas.",
  buttonLabel: "Buka halaman kontak",
} as const;

export const blogPostMeta = {
  documentTitle: (postTitle: string) => `${postTitle} — Blog Vialdi Wedding`,
  notFoundDocumentTitle: "Artikel tidak ditemukan — Vialdi Wedding",
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
  contactCta: "Kontak Vialdi Wedding",
} as const;
