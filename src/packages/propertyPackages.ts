import { z } from "zod";
import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
import { resolvePackageStoragePublicUrl } from "@/blog/packageStoragePublicUrl";
import { supabase } from "@/share/supabaseClient";
import { randomUuidV4 } from "@/share/lib/randomUuid";

export const PROPERTY_PACKAGE_BUCKET = "package-media";

const bulletItemZ = z.object({
  text: z.string(),
  struck: z.boolean().optional(),
});

export const propertyPackageSectionZ = z.object({
  id: z.string(),
  title: z.string(),
  intro: z.string().nullable().optional(),
  bullets: z.array(z.string()).nullable().optional(),
  bullet_items: z.array(bulletItemZ).nullable().optional(),
  bonus_lines: z.array(z.object({ text: z.string(), struck: z.boolean() })).nullable().optional(),
});

export type PropertyPackageSection = z.infer<typeof propertyPackageSectionZ>;

const rowZ = z.object({
  id: z.string().uuid(),
  web_id: z.string().optional(),
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

export type PropertyPackageRow = Omit<z.infer<typeof rowZ>, "sections"> & {
  sections: PropertyPackageSection[];
};

function parseSections(raw: unknown): PropertyPackageSection[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: PropertyPackageSection[] = [];
  for (const item of raw) {
    const p = propertyPackageSectionZ.safeParse(item);
    if (p.success) {
      out.push(p.data);
    }
  }
  return out;
}

function mapRow(r: z.infer<typeof rowZ>): PropertyPackageRow {
  return {
    ...r,
    sections: parseSections(r.sections),
  };
}

/** Agency CMS fields (summary, spent budget, fee) apply to Vialdi ID property. */
export function isAgencyPackageWeb(webId: string): boolean {
  return webId === "vialdi";
}

export function resolvePropertyPackageStorageUrl(
  path: string | null | undefined,
  url: string | null | undefined,
): string | null {
  return resolvePackageStoragePublicUrl(path, url);
}

export async function fetchPublishedPropertyPackages(): Promise<PropertyPackageRow[]> {
  const webId = getRequiredWebId();
  const { data, error } = await supabase
    .from("property_packages")
    .select("*")
    .eq("web_id", webId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) {
    throw error;
  }
  const out: PropertyPackageRow[] = [];
  for (const raw of (data ?? []) as unknown[]) {
    const p = rowZ.safeParse(raw);
    if (p.success) {
      out.push(mapRow(p.data));
    }
  }
  return out;
}

export async function fetchPublishedPropertyPackagesByIds(
  ids: readonly string[],
): Promise<PropertyPackageRow[]> {
  const webId = getRequiredWebId();
  const unique = [...new Set(ids.map((x) => x.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from("property_packages")
    .select("*")
    .eq("web_id", webId)
    .eq("is_published", true)
    .in("id", unique);
  if (error) {
    throw error;
  }
  const byId = new Map<string, PropertyPackageRow>();
  for (const raw of data ?? []) {
    const p = rowZ.safeParse(raw);
    if (p.success) {
      byId.set(p.data.id, mapRow(p.data));
    }
  }
  return unique.map((id) => byId.get(id)).filter((x): x is PropertyPackageRow => Boolean(x));
}

export async function adminListPropertyPackages(): Promise<PropertyPackageRow[]> {
  const webId = getRequiredWebId();
  const { data, error } = await supabase
    .from("property_packages")
    .select("*")
    .eq("web_id", webId)
    .order("sort_order", { ascending: true });
  if (error) {
    throw error;
  }
  const out: PropertyPackageRow[] = [];
  for (const raw of data ?? []) {
    const p = rowZ.safeParse(raw);
    if (p.success) {
      out.push(mapRow(p.data));
    }
  }
  return out;
}

export async function adminFetchPropertyPackage(id: string): Promise<PropertyPackageRow | null> {
  const webId = getRequiredWebId();
  const { data, error } = await supabase
    .from("property_packages")
    .select("*")
    .eq("web_id", webId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  const p = rowZ.safeParse(data);
  return p.success ? mapRow(p.data) : null;
}

export type PropertyPackageUpsert = {
  id?: string;
  slug: string;
  sort_order: number;
  is_published: boolean;
  badge_label: string;
  title: string;
  package_label: string;
  summary?: string | null;
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
  spent_budget_min?: number | null;
  spent_budget_max?: number | null;
  spent_budget_currency?: string | null;
  spent_budget_period?: string | null;
  fee_percent?: number | null;
  sections: PropertyPackageSection[];
};

export async function adminUpsertPropertyPackage(
  payload: PropertyPackageUpsert,
  userId: string,
): Promise<PropertyPackageRow> {
  const webId = getRequiredWebId();
  const agency = isAgencyPackageWeb(webId);

  const row = {
    web_id: webId,
    slug: payload.slug.trim(),
    sort_order: payload.sort_order,
    is_published: payload.is_published,
    badge_label: payload.badge_label.trim(),
    title: payload.title.trim(),
    package_label: payload.package_label.trim().slice(0, 500),
    summary: agency ? payload.summary?.trim() || null : null,
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
    spent_budget_min: agency ? payload.spent_budget_min : null,
    spent_budget_max: agency ? payload.spent_budget_max : null,
    spent_budget_currency: agency ? (payload.spent_budget_currency?.trim() || "IDR") : null,
    spent_budget_period: agency ? (payload.spent_budget_period?.trim() || "per bulan") : null,
    fee_percent: agency ? payload.fee_percent : null,
    sections: payload.sections as unknown[],
    updated_by: userId,
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("property_packages")
      .update(row)
      .eq("web_id", webId)
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

  const { data, error } = await supabase.from("property_packages").insert(row).select("*").single();
  if (error) {
    throw error;
  }
  const p = rowZ.safeParse(data);
  if (!p.success) {
    throw new Error("Invalid package row after insert");
  }
  return mapRow(p.data);
}

export async function adminDeletePropertyPackage(id: string): Promise<void> {
  const webId = getRequiredWebId();
  const { error } = await supabase.from("property_packages").delete().eq("web_id", webId).eq("id", id);
  if (error) {
    throw error;
  }
}

export async function uploadPropertyPackageMedia(file: File, userId: string): Promise<string> {
  const webId = getRequiredWebId();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${webId}/packages/${userId}/${randomUuidV4()}.${ext}`;
  const { error } = await supabase.storage.from(PROPERTY_PACKAGE_BUCKET).upload(path, file, { upsert: true });
  if (error) {
    throw error;
  }
  return path;
}
