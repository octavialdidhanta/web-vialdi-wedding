import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
import { supabase } from "@/share/supabaseClient";
import {
  jakartaTodayYmd as jakartaTodayYmdTz,
  jakartaYmdAddDays,
} from "@/admin/lib/trafficDashboardDateRange";

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

export type AnalyticsDurationRow = { path: string; avg_ms: number };
export type AnalyticsHeatmapRow = {
  route_bucket: string;
  hour_of_day: number;
  avg_ms: number;
};

export type AdminAnalyticsSummary = {
  totals: AnalyticsTotals;
  daily: AnalyticsDailyRow[];
  duration_by_path: AnalyticsDurationRow[];
  heatmap: AnalyticsHeatmapRow[];
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
  };
}

/** yyyy-mm-dd untuk hari kalender saat ini di Asia/Jakarta (sama dengan bucket RPC). */
export function jakartaTodayYmd(): string {
  return jakartaTodayYmdTz();
}

/** `daysAgo` hari kalender sebelum hari ini di Jakarta (0 = hari ini). */
export function jakartaDaysAgoYmd(daysAgo: number): string {
  return jakartaYmdAddDays(jakartaTodayYmdTz(), -daysAgo);
}

/** Min/max tanggal rollup harian (`analytics_daily_source_breakdown`) untuk satu web — dipakai preset Maximum. */
export async function adminFetchRollupDayBounds(
  webId: string,
): Promise<{ min: string | null; max: string | null }> {
  const { data: minRow, error: e1 } = await supabase
    .from("analytics_daily_source_breakdown")
    .select("day")
    .eq("web_id", webId)
    .order("day", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: maxRow, error: e2 } = await supabase
    .from("analytics_daily_source_breakdown")
    .select("day")
    .eq("web_id", webId)
    .order("day", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (e1 || e2) {
    console.warn("[adminFetchRollupDayBounds]", e1 ?? e2);
  }

  function rowDay(r: { day: unknown } | null): string | null {
    if (!r?.day) return null;
    if (typeof r.day === "string") return r.day.slice(0, 10);
    if (r.day instanceof Date) return r.day.toISOString().slice(0, 10);
    return String(r.day).slice(0, 10);
  }

  return {
    min: rowDay(minRow),
    max: rowDay(maxRow),
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

/** Sama dengan Traffic UI lain: `get_traffic_dashboard` → dedup `visit_key` + KPI gabungan PV + klik (WIB per hari). */
export type TrafficDashboardKpis = {
  sessions: number;
  page_views: number;
  clicks: number;
};

/** Satu baris `source_breakdown` dari `get_traffic_dashboard` (klasifikasi `source_key` / visit_key). */
export type TrafficSourceBreakdownRow = {
  key: string;
  label: string;
  sessions: number;
  page_views: number;
  clicks: number;
  max_deep_scroll_pct: number | null;
  avg_max_deep_scroll_pct: number | null;
  scroll_sessions: number;
};

/** Satu baris `utm_table` dari `get_traffic_dashboard` (satu `visit_key`, hanya utm / paid_click_ids). */
export type UtmTrackingRow = {
  visit_key: string;
  visitor_id: string | null;
  session_id: string;
  occurred_at: string;
  time_label: string;
  /** yyyy-mm-dd kalender WIB */
  day: string;
  route: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
  page_views: number;
  clicks: number;
  max_deep_scroll_pct: number | null;
  avg_max_deep_scroll_pct: number | null;
};

/** Satu baris `top_pages` dari `get_traffic_dashboard` (page view mentah + traffic_path_key, bukan source_breakdown). */
export type TrafficTopPagesRow = {
  path: string;
  impr: number;
  unique_sessions: number;
  clicks: number;
  median_active_ms: number;
  avg_active_ms: number;
  /** Sama dengan unique_sessions di payload backend. */
  n: number;
  max_deep_scroll_pct: number | null;
  avg_max_deep_scroll_pct: number | null;
};

export type TrafficDashboardPayload = {
  kpis: TrafficDashboardKpis;
  sourceBreakdown: TrafficSourceBreakdownRow[];
  utmTable: UtmTrackingRow[];
  topPages: TrafficTopPagesRow[];
};

export async function adminFetchTrafficDashboard(
  fromYmd: string,
  toYmd: string,
): Promise<TrafficDashboardPayload> {
  const p_web_id = getRequiredWebId();
  const { data, error } = await supabase.rpc("get_traffic_dashboard", {
    p_web_id,
    p_from: fromYmd,
    p_to: toYmd,
    p_top_pages_limit: 15,
    p_top_clicks_limit: 15,
    p_utm_limit: 2000,
  });
  if (error) {
    throw error;
  }
  const root = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const kpis =
    root.kpis && typeof root.kpis === "object" ? (root.kpis as Record<string, unknown>) : {};

  const rawSb = root.source_breakdown;
  const sourceBreakdown: TrafficSourceBreakdownRow[] = Array.isArray(rawSb)
    ? (rawSb as unknown[]).map((row) => {
        const x = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        const md = x.max_deep_scroll_pct;
        const am = x.avg_max_deep_scroll_pct;
        return {
          key: String(x.key ?? ""),
          label: String(x.label ?? ""),
          sessions: asNumber(x.sessions),
          page_views: asNumber(x.page_views),
          clicks: asNumber(x.clicks),
          max_deep_scroll_pct:
            md == null || md === "" ? null : asNumber(md as unknown),
          avg_max_deep_scroll_pct:
            am == null || am === "" ? null : asNumber(am as unknown),
          scroll_sessions: asNumber(x.scroll_sessions),
        };
      })
    : [];

  const rawTp = root.top_pages;
  const topPages: TrafficTopPagesRow[] = Array.isArray(rawTp)
    ? (rawTp as unknown[]).map((row) => {
        const x = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        const md = x.max_deep_scroll_pct;
        const am = x.avg_max_deep_scroll_pct;
        return {
          path: String(x.path ?? ""),
          impr: asNumber(x.impr),
          unique_sessions: asNumber(x.unique_sessions),
          clicks: asNumber(x.clicks),
          median_active_ms: asNumber(x.median_active_ms),
          avg_active_ms: asNumber(x.avg_active_ms),
          n: asNumber(x.n),
          max_deep_scroll_pct:
            md == null || md === "" ? null : asNumber(md as unknown),
          avg_max_deep_scroll_pct:
            am == null || am === "" ? null : asNumber(am as unknown),
        };
      })
    : [];

  const rawUt = root.utm_table;
  const utmTable: UtmTrackingRow[] = Array.isArray(rawUt)
    ? (rawUt as unknown[]).map((row) => {
        const x = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        const md = x.max_deep_scroll_pct;
        const am = x.avg_max_deep_scroll_pct;
        let dayStr = "";
        const d = x.day;
        if (typeof d === "string") {
          dayStr = d.slice(0, 10);
        } else if (d instanceof Date) {
          dayStr = d.toISOString().slice(0, 10);
        }
        return {
          visit_key: String(x.visit_key ?? ""),
          visitor_id:
            x.visitor_id != null && String(x.visitor_id).trim() !== ""
              ? String(x.visitor_id)
              : null,
          session_id: String(x.session_id ?? ""),
          occurred_at: String(x.occurred_at ?? ""),
          time_label: String(x.time_label ?? ""),
          day: dayStr,
          route: x.route != null && String(x.route) !== "" ? String(x.route) : null,
          utm_campaign: x.utm_campaign != null ? String(x.utm_campaign) : null,
          utm_source: x.utm_source != null ? String(x.utm_source) : null,
          utm_medium: x.utm_medium != null ? String(x.utm_medium) : null,
          utm_content: x.utm_content != null ? String(x.utm_content) : null,
          utm_term: x.utm_term != null ? String(x.utm_term) : null,
          page_views: asNumber(x.page_views),
          clicks: asNumber(x.clicks),
          max_deep_scroll_pct:
            md == null || md === "" ? null : asNumber(md as unknown),
          avg_max_deep_scroll_pct:
            am == null || am === "" ? null : asNumber(am as unknown),
        };
      })
    : [];

  return {
    kpis: {
      sessions: asNumber(kpis.sessions),
      page_views: asNumber(kpis.page_views),
      clicks: asNumber(kpis.clicks),
    },
    sourceBreakdown,
    utmTable,
    topPages,
  };
}

/** Baris dari `get_click_targets_for_source_key` (pecahan klik per target untuk satu `source_key`). */
export type ClickTargetDetailRow = {
  clicks: number;
  unique_sessions: number;
  track_key: string | null;
  element_type: string | null;
  element_label: string | null;
  target_url: string | null;
  is_internal: boolean;
};

/**
 * Path di `analytics_click_events` selalu memenuhi `validPath` (non-kosong, awalan `/`).
 * Baris UTM dari RPC kadang mengembalikan route beranda sebagai null / "" — harus disamakan ke `/`
 * agar `get_click_targets_for_*` bisa join ke baris klik.
 */
function normalizeRpcPathForClicks(path: string): string {
  const t = String(path ?? "").trim();
  return t.length === 0 ? "/" : t;
}

function parseClickTargetRows(data: unknown): ClickTargetDetailRow[] {
  let rows: unknown[] = [];
  if (Array.isArray(data)) {
    rows = data;
  } else if (typeof data === "string" && data.trim() !== "") {
    try {
      const parsed = JSON.parse(data) as unknown;
      rows = Array.isArray(parsed) ? parsed : [];
    } catch {
      rows = [];
    }
  }
  return rows.map((row) => {
    const x = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    return {
      clicks: asNumber(x.clicks),
      unique_sessions: asNumber(x.unique_sessions),
      track_key: x.track_key != null && String(x.track_key) !== "" ? String(x.track_key) : null,
      element_type: x.element_type != null ? String(x.element_type) : null,
      element_label: x.element_label != null ? String(x.element_label) : null,
      target_url: x.target_url != null && String(x.target_url) !== "" ? String(x.target_url) : null,
      is_internal: Boolean(x.is_internal),
    };
  });
}

export async function adminFetchClickTargetsForPath(
  fromYmd: string,
  toYmd: string,
  p_path: string,
  p_limit = 50,
): Promise<ClickTargetDetailRow[]> {
  const p_web_id = getRequiredWebId();
  const { data, error } = await supabase.rpc("get_click_targets_for_path", {
    p_web_id,
    p_from: fromYmd,
    p_to: toYmd,
    p_path: normalizeRpcPathForClicks(p_path),
    p_limit,
  });
  if (error) {
    throw error;
  }
  return parseClickTargetRows(data);
}

export async function adminFetchClickTargetsForSourceKey(
  fromYmd: string,
  toYmd: string,
  p_source_key: string,
  p_limit = 50,
): Promise<ClickTargetDetailRow[]> {
  const p_web_id = getRequiredWebId();
  const { data, error } = await supabase.rpc("get_click_targets_for_source_key", {
    p_web_id,
    p_from: fromYmd,
    p_to: toYmd,
    p_source_key,
    p_limit,
  });
  if (error) {
    throw error;
  }
  return parseClickTargetRows(data);
}

/** Detail klik untuk satu baris UTM tracking (`get_click_targets_for_utm_row`). */
export async function adminFetchClickTargetsForUtmRow(args: {
  fromYmd: string;
  toYmd: string;
  route: string;
  utm_campaign: string;
  utm_source: string;
  utm_medium: string;
  utm_content: string;
  utm_term: string;
  session_id: string;
  session_day: string;
  visitor_id: string | null;
  p_limit?: number;
}): Promise<ClickTargetDetailRow[]> {
  const p_web_id = getRequiredWebId();
  const { data, error } = await supabase.rpc("get_click_targets_for_utm_row", {
    p_web_id,
    p_from: args.fromYmd,
    p_to: args.toYmd,
    p_route: normalizeRpcPathForClicks(args.route),
    p_utm_campaign: args.utm_campaign,
    p_utm_source: args.utm_source,
    p_utm_medium: args.utm_medium,
    p_utm_content: args.utm_content,
    p_utm_term: args.utm_term,
    p_session_id: args.session_id,
    p_session_day: args.session_day,
    p_limit: args.p_limit ?? 50,
    p_visitor_id:
      args.visitor_id != null && String(args.visitor_id).trim() !== ""
        ? String(args.visitor_id).trim()
        : null,
  });
  if (error) {
    throw error;
  }
  return parseClickTargetRows(data);
}
