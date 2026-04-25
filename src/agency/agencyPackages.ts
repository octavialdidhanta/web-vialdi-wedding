import { z } from "zod";
import { supabase } from "@/share/supabaseClient";
import { randomUuidV4 } from "@/share/lib/randomUuid";

const AGENCY_PACKAGE_BUCKET = "agency-package-media";

const bulletItemZ = z.object({
  text: z.string(),
  struck: z.boolean().optional(),
});

export const agencyPackageSectionZ = z.object({
  id: z.string(),
  title: z.string(),
  intro: z.string().nullable().optional(),
  bullets: z.array(z.string()).nullable().optional(),
  bullet_items: z.array(bulletItemZ).nullable().optional(),
  bonus_lines: z.array(z.object({ text: z.string(), struck: z.boolean() })).nullable().optional(),
});

export type AgencyPackageSection = z.infer<typeof agencyPackageSectionZ>;

const rowZ = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  sort_order: z.number(),
  is_published: z.boolean(),
  badge_label: z.string(),
  title: z.string(),
  package_label: z.string(),
  summary: z.string().nullable().optional(),
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
  spent_budget_min: z.number().nullable().optional(),
  spent_budget_max: z.number().nullable().optional(),
  spent_budget_currency: z.string().nullable().optional(),
  spent_budget_period: z.string().nullable().optional(),
  fee_percent: z.number().nullable().optional(),
  sections: z.any(),
  created_at: z.string(),
  updated_at: z.string(),
  updated_by: z.string().uuid().nullable().optional(),
});

export type AgencyPackageRow = Omit<z.infer<typeof rowZ>, "sections"> & {
  sections: AgencyPackageSection[];
};

function parseSections(raw: unknown): AgencyPackageSection[] {
  if (!Array.isArray(raw)) return [];
  const out: AgencyPackageSection[] = [];
  for (const item of raw) {
    const p = agencyPackageSectionZ.safeParse(item);
    if (p.success) out.push(p.data);
  }
  return out;
}

function mapRow(r: z.infer<typeof rowZ>): AgencyPackageRow {
  return {
    ...r,
    sections: parseSections(r.sections),
  };
}

export function resolveAgencyPackageStorageUrl(
  path: string | null | undefined,
  url: string | null | undefined,
): string | null {
  const u = url?.trim();
  if (u) return u;
  const p = path?.trim();
  if (!p) return null;
  const { data } = supabase.storage.from(AGENCY_PACKAGE_BUCKET).getPublicUrl(p);
  return data.publicUrl;
}

export async function fetchPublishedAgencyPackages(): Promise<AgencyPackageRow[]> {
  const { data, error } = await supabase
    .from("agency_packages")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const out: AgencyPackageRow[] = [];
  for (const raw of (data ?? []) as unknown[]) {
    const p = rowZ.safeParse(raw);
    if (p.success) out.push(mapRow(p.data));
  }
  return out;
}

export type AgencyPackageUpsert = {
  id?: string;
  slug: string;
  sort_order: number;
  is_published: boolean;
  badge_label: string;
  title: string;
  package_label: string;
  summary: string | null;
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
  spent_budget_min: number | null;
  spent_budget_max: number | null;
  spent_budget_currency: string;
  spent_budget_period: string;
  fee_percent: number;
  sections: AgencyPackageSection[];
};

export async function adminListAgencyPackages(): Promise<AgencyPackageRow[]> {
  const { data, error } = await supabase.from("agency_packages").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  const out: AgencyPackageRow[] = [];
  for (const raw of (data ?? []) as unknown[]) {
    const p = rowZ.safeParse(raw);
    if (p.success) out.push(mapRow(p.data));
  }
  return out;
}

export async function adminFetchAgencyPackage(id: string): Promise<AgencyPackageRow | null> {
  const { data, error } = await supabase.from("agency_packages").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p = rowZ.safeParse(data);
  return p.success ? mapRow(p.data) : null;
}

export async function adminUpsertAgencyPackage(payload: AgencyPackageUpsert, userId: string): Promise<AgencyPackageRow> {
  const row = {
    slug: payload.slug.trim(),
    sort_order: payload.sort_order,
    is_published: payload.is_published,
    badge_label: payload.badge_label.trim(),
    title: payload.title.trim(),
    package_label: payload.package_label.trim().slice(0, 500),
    summary: payload.summary?.trim() || null,
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
    spent_budget_min: payload.spent_budget_min,
    spent_budget_max: payload.spent_budget_max,
    spent_budget_currency: (payload.spent_budget_currency || "IDR").trim() || "IDR",
    spent_budget_period: (payload.spent_budget_period || "per bulan").trim() || "per bulan",
    fee_percent: payload.fee_percent,
    sections: payload.sections as unknown[],
    updated_by: userId,
  };

  if (payload.id) {
    const { data, error } = await supabase.from("agency_packages").update(row).eq("id", payload.id).select("*").single();
    if (error) throw error;
    const p = rowZ.safeParse(data);
    if (!p.success) throw new Error("Invalid agency package row after update");
    return mapRow(p.data);
  }

  const { data, error } = await supabase.from("agency_packages").insert(row).select("*").single();
  if (error) throw error;
  const p = rowZ.safeParse(data);
  if (!p.success) throw new Error("Invalid agency package row after insert");
  return mapRow(p.data);
}

export async function adminDeleteAgencyPackage(id: string): Promise<void> {
  const { error } = await supabase.from("agency_packages").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadAgencyPackageMedia(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `packages/${userId}/${randomUuidV4()}.${ext}`;
  const { error } = await supabase.storage.from(AGENCY_PACKAGE_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

