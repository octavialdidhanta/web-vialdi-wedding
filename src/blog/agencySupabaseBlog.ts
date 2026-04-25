import { supabase } from "@/share/supabaseClient";
import type { BlogAccent, BlogPostPublic, PostStatus, TocEntry } from "@/blog/types";
import { DEFAULT_BLOG_COVER } from "@/blog/defaultCover";
import { randomUuidV4 } from "@/share/lib/randomUuid";

// Reuse same bucket (schema separation is in DB tables).
export const BLOG_MEDIA_BUCKET = "blog-media";
const BUCKET = BLOG_MEDIA_BUCKET;

export type TagJoin = { agency_blog_tags: { name: string; slug: string } | null } | null;

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: PostStatus;
  featured: boolean;
  accent: BlogAccent;
  cover_image_path: string | null;
  cover_image_url: string | null;
  body_html: string;
  body_json?: unknown;
  toc_json: TocEntry[] | null;
  read_time_minutes: number;
  published_at: string | null;
  scheduled_at: string | null;
  post_tags?: TagJoin[] | null;
};

export function resolveCoverUrl(path: string | null, url: string | null): string {
  if (url) return url;
  if (path) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
  return DEFAULT_BLOG_COVER;
}

export function resolveBlogMediaPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function mapRowToPublic(p: PostRow): BlogPostPublic {
  const dateSource = p.published_at ?? p.scheduled_at;
  const published = dateSource ? new Date(dateSource) : new Date();
  const date = published.toISOString().slice(0, 10);
  const tags =
    p.post_tags
      ?.map((x) => x?.agency_blog_tags?.name)
      .filter((n): n is string => Boolean(n))
      .sort((a, b) => a.localeCompare(b)) ?? [];
  const toc = Array.isArray(p.toc_json) ? p.toc_json : [];
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date,
    readTimeMinutes: p.read_time_minutes,
    tags,
    featured: p.featured,
    accent: p.accent,
    coverImage: resolveCoverUrl(p.cover_image_path, p.cover_image_url),
    toc,
    bodyHtml: p.body_html ?? "",
    bodyJson: p.body_json,
  };
}

const publishedSelect = `
  id, slug, title, excerpt, status, featured, accent,
  cover_image_path, cover_image_url, body_json, body_html, toc_json,
  read_time_minutes, published_at, scheduled_at,
  post_tags:agency_post_tags ( agency_blog_tags:agency_blog_tags ( name, slug ) )
`;

const publishedListSelect = `
  id, slug, title, excerpt, status, featured, accent,
  cover_image_path, cover_image_url,
  read_time_minutes, published_at, scheduled_at,
  post_tags:agency_post_tags ( agency_blog_tags:agency_blog_tags ( name, slug ) )
`;

type PostListRow = Pick<
  PostRow,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "status"
  | "featured"
  | "accent"
  | "cover_image_path"
  | "cover_image_url"
  | "read_time_minutes"
  | "published_at"
  | "scheduled_at"
> & { post_tags?: TagJoin[] | null };

function mapListRowToPublic(p: PostListRow): BlogPostPublic {
  const dateSource = p.published_at ?? p.scheduled_at;
  const published = dateSource ? new Date(dateSource) : new Date();
  const date = published.toISOString().slice(0, 10);
  const tags =
    p.post_tags
      ?.map((x) => x?.agency_blog_tags?.name)
      .filter((n): n is string => Boolean(n))
      .sort((a, b) => a.localeCompare(b)) ?? [];
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date,
    readTimeMinutes: p.read_time_minutes,
    tags,
    featured: p.featured,
    accent: p.accent,
    coverImage: resolveCoverUrl(p.cover_image_path, p.cover_image_url),
    toc: [],
    bodyHtml: "",
    bodyJson: undefined,
  };
}

export async function fetchPublishedPosts(): Promise<BlogPostPublic[]> {
  const now = new Date().toISOString();
  const { data: publishedRows, error: errPub } = await supabase
    .from("agency_posts")
    .select(publishedListSelect)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .order("published_at", { ascending: false });
  if (errPub) throw errPub;

  const { data: dueScheduledRows, error: errSch } = await supabase
    .from("agency_posts")
    .select(publishedListSelect)
    .eq("status", "scheduled")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: false });
  if (errSch) throw errSch;

  const byId = new Map<string, PostListRow>();
  for (const row of [
    ...(((publishedRows as PostListRow[] | null) ?? []) as PostListRow[]),
    ...(((dueScheduledRows as PostListRow[] | null) ?? []) as PostListRow[]),
  ]) {
    byId.set(row.id, row);
  }
  const merged = Array.from(byId.values());
  merged.sort((a, b) => {
    const ta = new Date(a.published_at ?? a.scheduled_at ?? 0).getTime();
    const tb = new Date(b.published_at ?? b.scheduled_at ?? 0).getTime();
    return tb - ta;
  });
  return merged.map(mapListRowToPublic);
}

export async function fetchPublishedPostBySlug(slug: string): Promise<BlogPostPublic | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("agency_posts")
    .select(publishedSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", now)
    .maybeSingle();
  if (error) throw error;
  if (data) return mapRowToPublic(data as PostRow);

  const { data: due, error: errDue } = await supabase
    .from("agency_posts")
    .select(publishedSelect)
    .eq("slug", slug)
    .eq("status", "scheduled")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .maybeSingle();
  if (errDue) throw errDue;
  if (!due) return null;
  return mapRowToPublic(due as PostRow);
}

export function getRelatedPosts(current: BlogPostPublic, all: BlogPostPublic[], limit = 6): BlogPostPublic[] {
  const score = (p: BlogPostPublic) => p.tags.filter((t) => current.tags.includes(t)).length;
  return all
    .filter((p) => p.slug !== current.slug)
    .sort((a, b) => score(b) - score(a) || b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function getFeaturedPost(all: BlogPostPublic[]): BlogPostPublic | undefined {
  return all.find((p) => p.featured) ?? all[0];
}

export function getAllTagsFromPosts(posts: BlogPostPublic[]): string[] {
  const s = new Set<string>();
  for (const p of posts) for (const t of p.tags) s.add(t);
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

export type AdminPostRow = PostRow & {
  category_id: string | null;
  body_json: unknown;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  post_tags?: TagJoin[] | null;
};

const adminSelect = `
  id, slug, title, excerpt, status, featured, accent,
  cover_image_path, cover_image_url, body_json, body_html, toc_json,
  read_time_minutes, category_id, published_at, scheduled_at,
  created_at, updated_at, created_by, updated_by,
  post_tags:agency_post_tags ( agency_blog_tags:agency_blog_tags ( id, name, slug ) )
`;

export async function adminFetchPosts(): Promise<AdminPostRow[]> {
  const { data, error } = await supabase.from("agency_posts").select(adminSelect).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminPostRow[];
}

export async function adminFetchPost(id: string): Promise<AdminPostRow | null> {
  const { data, error } = await supabase.from("agency_posts").select(adminSelect).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as AdminPostRow) ?? null;
}

export async function adminDeletePost(id: string) {
  const { error } = await supabase.from("agency_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function adminListCategories() {
  const { data, error } = await supabase.from("agency_blog_categories").select("id, slug, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function adminListTags() {
  const { data, error } = await supabase.from("agency_blog_tags").select("id, slug, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function adminUpsertCategory(slug: string, name: string) {
  const { data, error } = await supabase
    .from("agency_blog_categories")
    .upsert({ slug, name }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function adminUpsertTag(slug: string, name: string) {
  const { data, error } = await supabase
    .from("agency_blog_tags")
    .upsert({ slug, name }, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function adminReplacePostTags(postId: string, tagNames: string[]) {
  await supabase.from("agency_post_tags").delete().eq("post_id", postId);
  const ids: string[] = [];
  for (const name of tagNames) {
    const slug = slugify(name) || "tag";
    const id = await adminUpsertTag(slug, name);
    ids.push(id);
  }
  if (ids.length) {
    const rows = ids.map((tag_id) => ({ post_id: postId, tag_id }));
    const { error } = await supabase.from("agency_post_tags").insert(rows);
    if (error) throw error;
  }
}

export type AdminPostPayload = {
  slug: string;
  title: string;
  excerpt: string;
  status: PostStatus;
  featured: boolean;
  accent: BlogAccent;
  cover_image_path: string | null;
  cover_image_url: string | null;
  body_json: unknown;
  body_html: string;
  toc_json: TocEntry[];
  read_time_minutes: number;
  category_id: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  updated_by: string | null;
};

export async function adminInsertPost(payload: AdminPostPayload, userId: string) {
  const { data, error } = await supabase
    .from("agency_posts")
    .insert({
      slug: payload.slug,
      title: payload.title,
      excerpt: payload.excerpt,
      status: payload.status,
      featured: payload.featured,
      accent: payload.accent,
      cover_image_path: payload.cover_image_path,
      cover_image_url: payload.cover_image_url,
      body_json: payload.body_json,
      body_html: payload.body_html,
      toc_json: payload.toc_json,
      read_time_minutes: payload.read_time_minutes,
      category_id: payload.category_id,
      published_at: payload.published_at,
      scheduled_at: payload.scheduled_at,
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function adminUpdatePost(id: string, payload: AdminPostPayload) {
  const { error } = await supabase
    .from("agency_posts")
    .update({
      slug: payload.slug,
      title: payload.title,
      excerpt: payload.excerpt,
      status: payload.status,
      featured: payload.featured,
      accent: payload.accent,
      cover_image_path: payload.cover_image_path,
      cover_image_url: payload.cover_image_url,
      body_json: payload.body_json,
      body_html: payload.body_html,
      toc_json: payload.toc_json,
      read_time_minutes: payload.read_time_minutes,
      category_id: payload.category_id,
      published_at: payload.published_at,
      scheduled_at: payload.scheduled_at,
      updated_by: payload.updated_by,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function uploadBlogImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${randomUuidV4()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

