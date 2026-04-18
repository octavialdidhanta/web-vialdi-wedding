/** Blog types shared by public site and admin CMS */

export type BlogAccent = "navy" | "orange" | "emerald" | "violet";

export type PostStatus = "draft" | "scheduled" | "published" | "archived";

export type TocEntry = { id: string; title: string };

/** Shape used by public BlogPage / BlogPostPage / PostCard */
export type BlogPostPublic = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date YYYY-MM-DD (from published_at) */
  date: string;
  readTimeMinutes: number;
  tags: string[];
  featured: boolean;
  accent: BlogAccent;
  coverImage: string;
  toc: TocEntry[];
  bodyHtml: string;
};

export const blogIndexSeo = {
  title: "Blog — vialdi.id | Wawasan digital marketing & growth",
  description:
    "Artikel ringan tentang lead, funnel, iklan, dan optimasi bisnis. Filter topik, cari judul, dan baca dengan pengalaman yang nyaman di perangkat apa pun.",
} as const;
