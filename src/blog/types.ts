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
