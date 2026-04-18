import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
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

export type AnalyticsPathRow = {
  path: string;
  impressions: number;
  /** Distinct session_id pada page_views path ini (rentang started_at). */
  unique_sessions: number;
  /** Jumlah analytics_click_events dengan path yang sama (rentang created_at). */
  path_clicks: number;
  /** Median active_ms; hanya bermakna jika duration_n > 0 (filter sama duration_by_path). */
  median_active_ms: number | null;
  /** Rata-rata active_ms pada subset yang sama dengan median. */
  avg_active_ms: number | null;
  /** Jumlah baris page_views yang masuk agregat durasi (ended_at not null OR active_ms > 0). */
  duration_n: number;
};
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

/** Sesi dengan aktivitas di rentang, dikelompokkan ke satu channel (heuristik server). */
export type AnalyticsAcquisitionChannelRow = {
  channel: string;
  sessions: number;
};

export type AnalyticsAcquisitionCampaignRow = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  sessions: number;
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
  acquisition_channels: AnalyticsAcquisitionChannelRow[];
  acquisition_top_campaigns: AnalyticsAcquisitionCampaignRow[];
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
          const durationN = asNumber(x.duration_n);
          const medianRaw = x.median_active_ms;
          const avgRaw = x.avg_active_ms;
          return {
            path: String(x.path ?? ""),
            impressions: asNumber(x.impressions),
            unique_sessions: asNumber(x.unique_sessions),
            path_clicks: asNumber(x.path_clicks),
            median_active_ms:
              durationN > 0 && medianRaw != null && medianRaw !== ""
                ? asNumber(medianRaw)
                : null,
            avg_active_ms:
              durationN > 0 && avgRaw != null && avgRaw !== "" ? asNumber(avgRaw) : null,
            duration_n: durationN,
          };
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
    acquisition_channels: Array.isArray(o.acquisition_channels)
      ? (o.acquisition_channels as unknown[]).map((row) => {
          const x = mapRow(row);
          return {
            channel: String(x.channel ?? ""),
            sessions: asNumber(x.sessions),
          };
        })
      : [],
    acquisition_top_campaigns: Array.isArray(o.acquisition_top_campaigns)
      ? (o.acquisition_top_campaigns as unknown[]).map((row) => {
          const x = mapRow(row);
          return {
            utm_source: String(x.utm_source ?? ""),
            utm_medium: String(x.utm_medium ?? ""),
            utm_campaign: String(x.utm_campaign ?? ""),
            sessions: asNumber(x.sessions),
          };
        })
      : [],
  };
}

/** yyyy-mm-dd untuk hari kalender saat ini di Asia/Jakarta (sama dengan bucket RPC). */
export function jakartaTodayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** `daysAgo` hari kalender sebelum hari ini di Jakarta (0 = hari ini). */
export function jakartaDaysAgoYmd(daysAgo: number): string {
  const today = jakartaTodayYmd();
  const ref = new Date(`${today}T12:00:00+07:00`);
  ref.setTime(ref.getTime() - daysAgo * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ref);
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
  const p_web_id = getRequiredWebId();
  const { data, error } = await supabase.rpc("admin_analytics_summary", {
    p_from,
    p_to,
    p_web_id,
  });
  if (error) {
    throw error;
  }
  return parseSummary(data);
}
