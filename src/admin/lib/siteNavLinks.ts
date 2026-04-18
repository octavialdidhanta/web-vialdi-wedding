/** Halaman statis + label untuk pemilih tautan di editor CMS. */
export type InternalLinkTarget = {
  id: string;
  title: string;
  path: string;
  kind: string;
};

export const STATIC_INTERNAL_LINKS: InternalLinkTarget[] = [
  { id: "nav-home", title: "Beranda", path: "/", kind: "Halaman" },
  { id: "nav-service", title: "Layanan", path: "/service", kind: "Halaman" },
  { id: "nav-blog", title: "Blog / Artikel", path: "/blog", kind: "Blog home" },
  { id: "nav-contact", title: "Hubungi kami", path: "/contact", kind: "Halaman" },
  { id: "nav-about", title: "Tentang kami", path: "/about-us", kind: "Halaman" },
  { id: "nav-terms", title: "Syarat & ketentuan", path: "/terms-and-conditions", kind: "Halaman" },
  { id: "nav-thanks", title: "Terima kasih", path: "/thank-you-page", kind: "Halaman" },
];

export function mergePostTargets(
  posts: { id: string; title: string; slug: string }[],
): InternalLinkTarget[] {
  const fromDb = posts.map((p) => ({
    id: `post-${p.id}`,
    title: p.title,
    path: `/blog/${p.slug}`,
    kind: "Artikel",
  }));
  return [...STATIC_INTERNAL_LINKS, ...fromDb];
}
