import { z } from "zod";
import { supabase } from "@/share/supabaseClient";
import { randomUuidV4 } from "@/share/lib/randomUuid";

const PACKAGE_BUCKET = "package-media";

const bulletItemZ = z.object({
  text: z.string(),
  struck: z.boolean().optional(),
});

export const weddingPackageSectionZ = z.object({
  id: z.string(),
  title: z.string(),
  intro: z.string().nullable().optional(),
  bullets: z.array(z.string()).nullable().optional(),
  bullet_items: z.array(bulletItemZ).nullable().optional(),
  bonus_lines: z.array(z.object({ text: z.string(), struck: z.boolean() })).nullable().optional(),
});

export type WeddingPackageSection = z.infer<typeof weddingPackageSectionZ>;

const rowZ = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  sort_order: z.number(),
  is_published: z.boolean(),
  badge_label: z.string(),
  title: z.string(),
  package_label: z.string(),
  strikethrough_price: z.string().nullable(),
  price: z.string(),
  promo_marquee_text: z.string().nullable(),
  footer_note: z.string().nullable(),
  footer_extra_html: z.string().nullable(),
  show_best_seller: z.boolean(),
  best_seller_image_path: z.string().nullable(),
  best_seller_image_url: z.string().nullable(),
  badge_image_path: z.string().nullable(),
  badge_image_url: z.string().nullable(),
  promo_countdown_ends_at: z.string().nullable(),
  footer_countdown_label: z.string().nullable(),
  show_footer_countdown: z.boolean(),
  sections: z.any(),
  created_at: z.string(),
  updated_at: z.string(),
  updated_by: z.string().uuid().nullable().optional(),
});

export type WeddingPackageRow = Omit<z.infer<typeof rowZ>, "sections"> & {
  sections: WeddingPackageSection[];
};

function parseSections(raw: unknown): WeddingPackageSection[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: WeddingPackageSection[] = [];
  for (const item of raw) {
    const p = weddingPackageSectionZ.safeParse(item);
    if (p.success) {
      out.push(p.data);
    }
  }
  return out;
}

function mapRow(r: z.infer<typeof rowZ>): WeddingPackageRow {
  return {
    ...r,
    sections: parseSections(r.sections),
  };
}

export function resolvePackageStorageUrl(path: string | null | undefined, url: string | null | undefined): string | null {
  const u = url?.trim();
  if (u) {
    return u;
  }
  const p = path?.trim();
  if (!p) {
    return null;
  }
  const { data } = supabase.storage.from(PACKAGE_BUCKET).getPublicUrl(p);
  return data.publicUrl;
}

export async function fetchPublishedPackages(): Promise<WeddingPackageRow[]> {
  const { data, error } = await supabase
    .from("wedding_packages")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) {
    throw error;
  }
  const rows = (data ?? []) as unknown[];
  const out: WeddingPackageRow[] = [];
  for (const raw of rows) {
    const p = rowZ.safeParse(raw);
    if (p.success) {
      out.push(mapRow(p.data));
    }
  }
  return out;
}

export async function fetchPublishedPackagesByIds(ids: readonly string[]): Promise<WeddingPackageRow[]> {
  const unique = [...new Set(ids.map((x) => x.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from("wedding_packages")
    .select("*")
    .eq("is_published", true)
    .in("id", unique);
  if (error) {
    throw error;
  }
  const byId = new Map<string, WeddingPackageRow>();
  for (const raw of data ?? []) {
    const p = rowZ.safeParse(raw);
    if (p.success) {
      byId.set(p.data.id, mapRow(p.data));
    }
  }
  return unique.map((id) => byId.get(id)).filter((x): x is WeddingPackageRow => Boolean(x));
}

export async function adminListPackages(): Promise<WeddingPackageRow[]> {
  const { data, error } = await supabase.from("wedding_packages").select("*").order("sort_order", { ascending: true });
  if (error) {
    throw error;
  }
  const out: WeddingPackageRow[] = [];
  for (const raw of data ?? []) {
    const p = rowZ.safeParse(raw);
    if (p.success) {
      out.push(mapRow(p.data));
    }
  }
  return out;
}

export async function adminFetchPackage(id: string): Promise<WeddingPackageRow | null> {
  const { data, error } = await supabase.from("wedding_packages").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  const p = rowZ.safeParse(data);
  return p.success ? mapRow(p.data) : null;
}

export type WeddingPackageUpsert = {
  id?: string;
  slug: string;
  sort_order: number;
  is_published: boolean;
  badge_label: string;
  title: string;
  package_label: string;
  strikethrough_price: string | null;
  price: string;
  promo_marquee_text: string | null;
  footer_note: string | null;
  footer_extra_html: string | null;
  show_best_seller: boolean;
  best_seller_image_path: string | null;
  best_seller_image_url: string | null;
  badge_image_path: string | null;
  badge_image_url: string | null;
  promo_countdown_ends_at: string | null;
  footer_countdown_label: string | null;
  show_footer_countdown: boolean;
  sections: WeddingPackageSection[];
};

export async function adminUpsertPackage(payload: WeddingPackageUpsert, userId: string): Promise<WeddingPackageRow> {
  const row = {
    slug: payload.slug.trim(),
    sort_order: payload.sort_order,
    is_published: payload.is_published,
    badge_label: payload.badge_label.trim(),
    title: payload.title.trim(),
    package_label: payload.package_label.trim().slice(0, 500),
    strikethrough_price: payload.strikethrough_price?.trim() || null,
    price: payload.price.trim(),
    promo_marquee_text: payload.promo_marquee_text?.trim() || null,
    footer_note: payload.footer_note?.trim() || null,
    footer_extra_html: payload.footer_extra_html?.trim() || null,
    show_best_seller: payload.show_best_seller,
    best_seller_image_path: payload.best_seller_image_path?.trim() || null,
    best_seller_image_url: payload.best_seller_image_url?.trim() || null,
    badge_image_path: payload.badge_image_path?.trim() || null,
    badge_image_url: payload.badge_image_url?.trim() || null,
    promo_countdown_ends_at: payload.promo_countdown_ends_at?.trim() || null,
    footer_countdown_label: payload.footer_countdown_label?.trim() || null,
    show_footer_countdown: payload.show_footer_countdown,
    sections: payload.sections as unknown[],
    updated_by: userId,
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("wedding_packages")
      .update(row)
      .eq("id", payload.id)
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    const p = rowZ.safeParse(data);
    if (!p.success) {
      throw new Error("Invalid package row after update");
    }
    return mapRow(p.data);
  }

  const { data, error } = await supabase.from("wedding_packages").insert(row).select("*").single();
  if (error) {
    throw error;
  }
  const p = rowZ.safeParse(data);
  if (!p.success) {
    throw new Error("Invalid package row after insert");
  }
  return mapRow(p.data);
}

export async function adminDeletePackage(id: string): Promise<void> {
  const { error } = await supabase.from("wedding_packages").delete().eq("id", id);
  if (error) {
    throw error;
  }
}

export async function uploadPackageMedia(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `packages/${userId}/${randomUuidV4()}.${ext}`;
  const { error } = await supabase.storage.from(PACKAGE_BUCKET).upload(path, file, { upsert: true });
  if (error) {
    throw error;
  }
  return path;
}
