/** Copy halaman blog indeks & label terkait artikel (Vialdi Wedding). */

export const blogIndexSeo = {
  title: "Blog — Vialdi Wedding | Inspirasi & tips pernikahan",
  description:
    "Artikel ringan seputar persiapan pernikahan: organisasi acara, vendor, rundown, dokumentasi, dan ide dekor. Saring topik, cari judul, baca nyaman di ponsel maupun desktop.",
} as const;

export const blogHero = {
  eyebrow: "Jurnal Vialdi Wedding",
  title: "Baca pelan-pelan—tiap artikel bisa jadi referensi saat Anda merencanakan hari bahagia.",
  subtitle:
    "Saring topik, cari kata kunci, atau mulai dari tulisan sorotan kami. Halaman ini tetap ringan di layar lebar maupun di genggaman.",
} as const;

export const blogSearch = {
  placeholder: "Cari judul, topik, atau ringkasan…",
  ariaLabel: "Cari artikel blog",
} as const;

export const blogFeatured = {
  heading: "Sorotan",
  badge: "Mulai dari sini",
} as const;

export const blogList = {
  allArticlesHeading: "Semua artikel",
} as const;

export const blogEmpty = {
  title: "Belum ada artikel yang cocok.",
  hint: "Coba hapus filter atau kata kunci lain.",
  resetLabel: "Reset pencarian & filter",
} as const;

export const blogCta = {
  title: "Ingin merencanakan pernikahan bersama kami?",
  subtitle:
    "Ceritakan tanggal, gambaran venue, dan hal yang membuat Anda gelisah—tim kami membantu menyambungkan wawasan di blog dengan langkah nyata di lapangan.",
  buttonLabel: "Jadwalkan konsultasi",
} as const;

export const blogPostMeta = {
  /** Judul tab saat artikel ditemukan. */
  documentTitle: (postTitle: string) => `${postTitle} — Blog Vialdi Wedding`,
  notFoundDocumentTitle: "Artikel tidak ditemukan — Vialdi Wedding",
  notFoundDescription: "Artikel blog tidak ditemukan.",
} as const;

export const blogPostUi = {
  backToBlog: "Kembali ke arsip blog",
  backToBlogShort: "← Kembali ke blog",
  loadErrorHeading: "Gagal memuat",
  notFoundHeading: "Artikel tidak ditemukan",
  notFoundSlugHint: "Slug tidak cocok dengan arsip kami.",
  relatedEmpty: "Belum ada rekomendasi artikel lain.",
  allPostsLink: "Lihat semua artikel",
  contactCta: "Hubungi Vialdi Wedding",
} as const;
