import { supabase } from "@/share/supabaseClient";

export type HubProperty = {
  slug: string;
  display_name: string;
};

export type HubLeadSubmissionRow = {
  id: string;
  web_id: string;
  property_display_name: string | null;
  form_id: string;
  form_version: number;
  step: number;
  status: string;
  name: string | null;
  phone_number: string | null;
  email: string | null;
  package_label: string | null;
  lead_id: string | null;
  analytics_session_id: string | null;
  attribution_label: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  form_data: Record<string, unknown>;
};

export async function adminListProperties(): Promise<HubProperty[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("slug, display_name")
    .eq("is_active", true)
    .order("display_name");
  if (error) throw error;
  return (data ?? []) as HubProperty[];
}

export async function adminListLeadSubmissions(args: {
  web_id?: string | null;
  from?: string | null;
  to?: string | null;
  form_id?: string | null;
  limit?: number;
  offset?: number;
}): Promise<HubLeadSubmissionRow[]> {
  const { data, error } = await supabase.rpc("admin_list_lead_submissions", {
    p_web_id: args.web_id ?? null,
    p_from: args.from ?? null,
    p_to: args.to ?? null,
    p_form_id: args.form_id ?? null,
    p_limit: args.limit ?? 50,
    p_offset: args.offset ?? 0,
  });
  if (error) throw error;
  return (data ?? []) as HubLeadSubmissionRow[];
}
