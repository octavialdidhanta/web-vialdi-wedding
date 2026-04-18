import { supabase } from "@/share/supabaseClient";

export type AnalyticsTotals = {
  impressions: number;
  clicks: number;
  unique_sessions: number;
};

export type AnalyticsDailyRow = {
  day: string;
  impressions: number;
  clicks: number;
};

export type AnalyticsPathRow = { path: string; impressions: number };
export type AnalyticsTrackKeyRow = { track_key: string; clicks: number; ctr: number };
export type AnalyticsBlogRow = {
  path: string;
  title: string | null;
  impressions: number;
  avg_active_ms: number;
};

export type AnalyticsDurationRow = { path: string; avg_ms: number };
export type AnalyticsHeatmapRow = {
  route_bucket: string;
  hour_of_day: number;
  avg_ms: number;
};

export type AnalyticsServiceSlice = {
  impressions: number;
  contact_clicks_on_service: number;
  conversion: number;
};

export type AdminAnalyticsSummary = {
  totals: AnalyticsTotals;
  daily: AnalyticsDailyRow[];
  top_paths: AnalyticsPathRow[];
  top_track_keys: AnalyticsTrackKeyRow[];
  top_blog: AnalyticsBlogRow[];
  duration_by_path: AnalyticsDurationRow[];
  heatmap: AnalyticsHeatmapRow[];
  service: AnalyticsServiceSlice;
};

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function parseSummary(raw: unknown): AdminAnalyticsSummary {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const totals = (o.totals && typeof o.totals === "object" ? o.totals : {}) as Record<
    string,
    unknown
  >;
  const svc = (o.service && typeof o.service === "object" ? o.service : {}) as Record<
    string,
    unknown
  >;

  const mapRow = (r: unknown): Record<string, unknown> =>
    r && typeof r === "object" ? (r as Record<string, unknown>) : {};

  return {
    totals: {
      impressions: asNumber(totals.impressions),
      clicks: asNumber(totals.clicks),
      unique_sessions: asNumber(totals.unique_sessions),
    },
    daily: Array.isArray(o.daily)
      ? (o.daily as unknown[]).map((row) => {
          const x = mapRow(row);
          return {
            day: x.day as string,
            impressions: asNumber(x.impressions),
            clicks: asNumber(x.clicks),
          };
        })
      : [],
    top_paths: Array.isArray(o.top_paths)
      ? (o.top_paths as unknown[]).map((row) => {
          const x = mapRow(row);
          return { path: String(x.path ?? ""), impressions: asNumber(x.impressions) };
        })
      : [],
    top_track_keys: Array.isArray(o.top_track_keys)
      ? (o.top_track_keys as unknown[]).map((row) => {
          const x = mapRow(row);
          return {
            track_key: String(x.track_key ?? ""),
            clicks: asNumber(x.clicks),
            ctr: asNumber(x.ctr),
          };
        })
      : [],
    top_blog: Array.isArray(o.top_blog)
      ? (o.top_blog as unknown[]).map((row) => {
          const x = mapRow(row);
          return {
            path: String(x.path ?? ""),
            title: x.title != null ? String(x.title) : null,
            impressions: asNumber(x.impressions),
            avg_active_ms: asNumber(x.avg_active_ms),
          };
        })
      : [],
    duration_by_path: Array.isArray(o.duration_by_path)
      ? (o.duration_by_path as unknown[]).map((row) => {
          const x = mapRow(row);
          return { path: String(x.path ?? ""), avg_ms: asNumber(x.avg_ms) };
        })
      : [],
    heatmap: Array.isArray(o.heatmap)
      ? (o.heatmap as unknown[]).map((row) => {
          const x = mapRow(row);
          return {
            route_bucket: String(x.route_bucket ?? ""),
            hour_of_day: asNumber(x.hour_of_day),
            avg_ms: asNumber(x.avg_ms),
          };
        })
      : [],
    service: {
      impressions: asNumber(svc.impressions),
      contact_clicks_on_service: asNumber(svc.contact_clicks_on_service),
      conversion: asNumber(svc.conversion),
    },
  };
}

/** Rentang inklusif [fromYmd, toYmd] diinterpretasikan sebagai hari kalender Asia/Jakarta. */
export function jakartaDayRangeToIso(
  fromYmd: string,
  toYmd: string,
): { p_from: string; p_to: string } {
  const p_from = new Date(`${fromYmd}T00:00:00+07:00`).toISOString();
  const p_to = new Date(`${toYmd}T23:59:59.999+07:00`).toISOString();
  return { p_from, p_to };
}

export async function adminFetchAnalyticsSummary(
  p_from: string,
  p_to: string,
): Promise<AdminAnalyticsSummary> {
  const { data, error } = await supabase.rpc("admin_analytics_summary", {
    p_from,
    p_to,
  });
  if (error) {
    throw error;
  }
  return parseSummary(data);
}
