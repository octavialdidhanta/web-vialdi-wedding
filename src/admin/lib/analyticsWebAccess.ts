import { supabase } from "@/share/supabaseClient";

/** Rows from existing `public.analytics_web_access` (organization ↔ web_id, approval). */
export type AnalyticsWebAccessRow = {
  organization_id: string;
  /** `organizations.company_name`; null jika tidak ada / tidak bisa dibaca RLS. */
  organization_name: string | null;
  web_id: string;
  created_at: string;
  created_by: string | null;
  is_approved: boolean;
};

type AnalyticsWebAccessDbRow = {
  organization_id: string;
  web_id: string;
  created_at: string;
  created_by: string | null;
  is_approved: boolean;
  organizations: { company_name: string | null } | null;
};

export async function adminListAnalyticsWebAccess(): Promise<AnalyticsWebAccessRow[]> {
  const { data, error } = await supabase
    .from("analytics_web_access")
    .select(
      "organization_id, web_id, created_at, created_by, is_approved, organizations ( company_name )",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as AnalyticsWebAccessDbRow[];
  return rows.map((r) => ({
    organization_id: r.organization_id,
    organization_name: r.organizations?.company_name?.trim() || null,
    web_id: r.web_id,
    created_at: r.created_at,
    created_by: r.created_by,
    is_approved: r.is_approved,
  }));
}

export async function adminApproveAnalyticsWebAccess(row: {
  organization_id: string;
  web_id: string;
}): Promise<void> {
  const { error } = await supabase
    .from("analytics_web_access")
    .update({ is_approved: true })
    .eq("organization_id", row.organization_id)
    .eq("web_id", row.web_id)
    .eq("is_approved", false);
  if (error) throw error;
}

/** Cabut persetujuan / putuskan akses (is_approved → false). */
export async function adminRevokeAnalyticsWebAccess(row: {
  organization_id: string;
  web_id: string;
}): Promise<void> {
  const { error } = await supabase
    .from("analytics_web_access")
    .update({ is_approved: false })
    .eq("organization_id", row.organization_id)
    .eq("web_id", row.web_id)
    .eq("is_approved", true);
  if (error) throw error;
}
