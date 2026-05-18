import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAnalyticsDashboardRealtime } from "@/admin/hooks/useAnalyticsDashboardRealtime";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getRequiredWebId } from "@/analytics/sendAnalyticsBatch";
import { adminFetchPosts } from "@/blog/agencySupabaseBlog";
import {
  adminFetchAnalyticsSummary,
  adminFetchClickTargetsForPath,
  adminFetchClickTargetsForSourceKey,
  adminFetchClickTargetsForUtmRow,
  adminFetchTrafficDashboard,
  jakartaDayRangeToIso,
  type AdminAnalyticsSummary,
  type TrafficDashboardKpis,
  type TrafficSourceBreakdownRow,
  type TrafficTopPagesRow,
  type UtmTrackingRow,
} from "@/admin/lib/analyticsAdmin";
import { TrafficDateRangeControl } from "@/admin/components/TrafficDateRangeDialog";
import {
  computeTrafficPresetRange,
  jakartaTodayYmd,
  type TrafficDatePreset,
} from "@/admin/lib/trafficDashboardDateRange";
import { Button } from "@/share/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/share/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/share/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/share/ui/tooltip";
import { cn } from "@/share/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown, Info } from "lucide-react";

const HEAT_BUCKETS = ["home", "service", "blog_index", "blog_post", "other"] as const;

function formatDayKey(day: unknown): string {
  if (typeof day === "string") {
    return day.slice(0, 10);
  }
  if (
    day &&
    typeof day === "object" &&
    "toISOString" in day &&
    typeof (day as Date).toISOString === "function"
  ) {
    return (day as Date).toISOString().slice(0, 10);
  }
  return String(day).slice(0, 10);
}

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return "—";
  }
  if (ms === 0) {
    return "0 dtk";
  }
  const s = Math.round(ms / 1000);
  if (s < 60) {
    return `${s} dtk`;
  }
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m} m ${r} dtk`;
}

function heatColor(avgMs: number, maxMs: number): string {
  if (maxMs <= 0 || !Number.isFinite(avgMs)) {
    return "hsl(var(--muted))";
  }
  const t = Math.min(1, avgMs / maxMs);
  const alpha = 0.15 + t * 0.75;
  return `rgba(249, 115, 22, ${alpha})`;
}

/** Label singkat kolom Sumber (selaras screenshot Traffic). */
const TRAFFIC_SOURCE_SHORT: Record<string, string> = {
  utm: "UTM",
  paid_click_ids: "Iklan berbayar",
  referral: "Referral",
  direct: "Langsung",
};

function trafficSourceShortLabel(key: string): string {
  return TRAFFIC_SOURCE_SHORT[key] ?? key;
}

function formatScrollPct(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${Math.round(v)}%`;
}

/** Path blog setelah normalisasi `traffic_path_key`: indeks atau artikel. */
function isTrafficBlogPath(path: string): boolean {
  const p = String(path ?? "");
  return p === "/blog" || p.startsWith("/blog/");
}

/** Durasi ringkas untuk Top pages / Top blog (mis. 15s); `0` atau tidak ada → — */
function formatActiveSecondsShort(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "—";
  return `${Math.round(ms / 1000)}s`;
}

const UTM_FILTER_ALL = "__ALL__";
const UTM_FILTER_EMPTY = "__EMPTY__";

const UTM_FILTER_KEYS = [
  "route",
  "utm_campaign",
  "utm_source",
  "utm_medium",
  "utm_content",
  "utm_term",
] as const;

type UtmFilterKey = (typeof UTM_FILTER_KEYS)[number];

type UtmSortColumn =
  | "occurred_at"
  | "route"
  | "utm_campaign"
  | "utm_source"
  | "utm_medium"
  | "utm_content"
  | "utm_term"
  | "page_views"
  | "clicks"
  | "max_deep_scroll_pct"
  | "avg_max_deep_scroll_pct";

function utmCellRaw(value: unknown): string {
  return String(value ?? "").trim();
}

function getUtmFilterCell(r: UtmTrackingRow, key: UtmFilterKey): string {
  switch (key) {
    case "route":
      return utmCellRaw(r.route);
    case "utm_campaign":
      return utmCellRaw(r.utm_campaign);
    case "utm_source":
      return utmCellRaw(r.utm_source);
    case "utm_medium":
      return utmCellRaw(r.utm_medium);
    case "utm_content":
      return utmCellRaw(r.utm_content);
    case "utm_term":
      return utmCellRaw(r.utm_term);
    default:
      return "";
  }
}

/** Nilai yang bisa dipilih di dropdown (tanpa "Semua"): `(kosong)` + nilai unik terurut. */
function utmColumnOptionValues(rows: UtmTrackingRow[], key: UtmFilterKey): string[] {
  const distinct = new Set<string>();
  let hasEmpty = false;
  for (const r of rows) {
    const v = getUtmFilterCell(r, key);
    if (v === "") hasEmpty = true;
    else distinct.add(v);
  }
  const sorted = [...distinct].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }),
  );
  const out: string[] = [];
  if (hasEmpty) out.push(UTM_FILTER_EMPTY);
  out.push(...sorted);
  return out;
}

function matchesUtmFilter(row: UtmTrackingRow, key: UtmFilterKey, filter: string): boolean {
  if (filter === UTM_FILTER_ALL) return true;
  const raw = getUtmFilterCell(row, key);
  if (filter === UTM_FILTER_EMPTY) return raw === "";
  return raw === filter;
}

function compareUtmSort(a: UtmTrackingRow, b: UtmTrackingRow, key: UtmSortColumn): number {
  switch (key) {
    case "occurred_at": {
      const ta = Date.parse(a.occurred_at);
      const tb = Date.parse(b.occurred_at);
      const na = Number.isFinite(ta) ? ta : -1;
      const nb = Number.isFinite(tb) ? tb : -1;
      return na === nb ? 0 : na < nb ? -1 : 1;
    }
    case "page_views":
      return (Number(a.page_views) || 0) - (Number(b.page_views) || 0);
    case "clicks":
      return (Number(a.clicks) || 0) - (Number(b.clicks) || 0);
    case "max_deep_scroll_pct": {
      const na =
        a.max_deep_scroll_pct != null && Number.isFinite(a.max_deep_scroll_pct)
          ? a.max_deep_scroll_pct
          : -1;
      const nb =
        b.max_deep_scroll_pct != null && Number.isFinite(b.max_deep_scroll_pct)
          ? b.max_deep_scroll_pct
          : -1;
      return na - nb;
    }
    case "avg_max_deep_scroll_pct": {
      const na =
        a.avg_max_deep_scroll_pct != null && Number.isFinite(a.avg_max_deep_scroll_pct)
          ? a.avg_max_deep_scroll_pct
          : -1;
      const nb =
        b.avg_max_deep_scroll_pct != null && Number.isFinite(b.avg_max_deep_scroll_pct)
          ? b.avg_max_deep_scroll_pct
          : -1;
      return na - nb;
    }
    case "route":
      return utmCellRaw(a.route).localeCompare(utmCellRaw(b.route), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    case "utm_campaign":
      return utmCellRaw(a.utm_campaign).localeCompare(utmCellRaw(b.utm_campaign), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    case "utm_source":
      return utmCellRaw(a.utm_source).localeCompare(utmCellRaw(b.utm_source), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    case "utm_medium":
      return utmCellRaw(a.utm_medium).localeCompare(utmCellRaw(b.utm_medium), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    case "utm_content":
      return utmCellRaw(a.utm_content).localeCompare(utmCellRaw(b.utm_content), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    case "utm_term":
      return utmCellRaw(a.utm_term).localeCompare(utmCellRaw(b.utm_term), undefined, {
        sensitivity: "base",
        numeric: true,
      });
    default:
      return 0;
  }
}

function UtmSortHeaderBtn({
  label,
  column,
  sortKey,
  sortDir,
  onCycle,
  align = "left",
}: {
  label: string;
  column: UtmSortColumn;
  sortKey: UtmSortColumn | null;
  sortDir: "asc" | "desc";
  onCycle: (c: UtmSortColumn) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === column;
  return (
    <button
      type="button"
      className={cn(
        "inline-flex w-full items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground",
        align === "right" ? "justify-end" : "justify-start",
      )}
      onClick={() => onCycle(column)}
    >
      <span>{label}</span>
      {active ? (
        sortDir === "asc" ? (
          <ArrowUp className="size-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
        ) : (
          <ArrowDown className="size-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
        )
      ) : (
        <ArrowUpDown className="size-3.5 shrink-0 opacity-45" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}

export function AdminDashboardPage() {
  const [rangePreset, setRangePreset] = useState<TrafficDatePreset>("today");
  const [fromYmd, setFromYmd] = useState(
    () => computeTrafficPresetRange("today", jakartaTodayYmd(), null).from,
  );
  const [toYmd, setToYmd] = useState(
    () => computeTrafficPresetRange("today", jakartaTodayYmd(), null).to,
  );

  const rangeIso = useMemo(() => jakartaDayRangeToIso(fromYmd, toYmd), [fromYmd, toYmd]);
  const webId = useMemo(() => getRequiredWebId(), []);

  useAnalyticsDashboardRealtime(true);

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "posts", webId],
    queryFn: adminFetchPosts,
  });

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ["admin", "analytics", webId, rangeIso.p_from, rangeIso.p_to],
    queryFn: () => adminFetchAnalyticsSummary(rangeIso.p_from, rangeIso.p_to),
    staleTime: 0,
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  /** KPI headline + Sumber traffic: `get_traffic_dashboard` (visit_key + source_breakdown). */
  const {
    data: trafficDashboard,
    isLoading: trafficKpisLoading,
    error: trafficKpisError,
  } = useQuery({
    queryKey: ["admin", "traffic-dashboard", webId, fromYmd, toYmd],
    queryFn: () => adminFetchTrafficDashboard(fromYmd, toYmd),
    staleTime: 0,
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const trafficKpis = trafficDashboard?.kpis ?? null;
  const trafficSourceBreakdown = trafficDashboard?.sourceBreakdown ?? [];
  const trafficUtmTable = trafficDashboard?.utmTable ?? [];
  const trafficTopPages = trafficDashboard?.topPages ?? [];

  const counts = useMemo(() => {
    const c = { draft: 0, scheduled: 0, published: 0, archived: 0 };
    for (const p of posts) {
      if (p.status in c) {
        c[p.status as keyof typeof c] += 1;
      }
    }
    return c;
  }, [posts]);

  const recent = useMemo(() => [...posts].slice(0, 10), [posts]);

  const dailyChart = useMemo(() => {
    if (!analytics?.daily?.length) {
      return [];
    }
    return analytics.daily.map((d) => ({
      dayLabel: formatDayKey(d.day),
      impressions: Number(d.impressions) || 0,
      clicks: Number(d.clicks) || 0,
    }));
  }, [analytics]);

  const heatMax = useMemo(() => {
    if (!analytics?.heatmap?.length) {
      return 0;
    }
    return Math.max(...analytics.heatmap.map((h) => Number(h.avg_ms) || 0), 1);
  }, [analytics]);

  const heatCells = useMemo(() => {
    const m = new Map<string, number>();
    if (!analytics?.heatmap) {
      return m;
    }
    for (const h of analytics.heatmap) {
      const key = `${h.route_bucket}-${h.hour_of_day}`;
      m.set(key, Number(h.avg_ms) || 0);
    }
    return m;
  }, [analytics]);

  return (
    <div className="p-6 md:p-8">
      <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-muted/25 px-6 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-muted/20 md:-mx-8 md:px-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Konten blog & traffic situs publik.</p>
        </div>
        <Button asChild>
          <Link to="/admin/posts/new">Artikel baru</Link>
        </Button>
      </div>

      {error ? <p className="mt-6 text-sm text-destructive">{(error as Error).message}</p> : null}

      <section className="mt-10 rounded-xl border border-border bg-card p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-navy">Traffic & interaksi</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Rentang tanggal (kalender Asia/Jakarta). Kartu besar Total sessions / All Page Views / Clicks memakai{" "}
          <code className="text-xs">get_traffic_dashboard</code> (dedup{" "}
          <code className="text-xs">visit_key</code>, sama halaman Traffic). Grafik &amp; tabel di bawah dari{" "}
          <code className="text-xs">admin_analytics_summary</code>. Angka diperbarui otomatis saat ada kunjungan atau
          klik baru (Realtime Supabase). Pastikan Edge <code className="text-xs">analytics-ingest</code> aktif.
        </p>
        <div className="mt-4 max-w-lg">
          <TrafficDateRangeControl
            webId={webId}
            appliedPreset={rangePreset}
            appliedFromYmd={fromYmd}
            appliedToYmd={toYmd}
            onApply={({ preset, fromYmd: f, toYmd: t }) => {
              setRangePreset(preset);
              setFromYmd(f);
              setToYmd(t);
            }}
          />
        </div>

        {trafficKpisError ? (
          <p className="mt-4 text-sm text-destructive">
            KPI Traffic: {(trafficKpisError as Error).message} — angka besar memakai cadangan dari analytics.
          </p>
        ) : null}
        {analyticsError ? (
          <p className="mt-4 text-sm text-destructive">{(analyticsError as Error).message}</p>
        ) : analyticsLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Memuat analytics…</p>
        ) : analytics ? (
          <AnalyticsPanels
            analytics={analytics}
            dailyChart={dailyChart}
            heatCells={heatCells}
            heatMax={heatMax}
            trafficKpis={trafficKpis ?? null}
            trafficKpisLoading={trafficKpisLoading}
            trafficSourceBreakdown={trafficSourceBreakdown}
            trafficTopPages={trafficTopPages}
            trafficUtmTable={trafficUtmTable}
            dateFromYmd={fromYmd}
            dateToYmd={toYmd}
            webId={webId}
          />
        ) : null}
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["draft", "scheduled", "published", "archived"] as const).map((key) => (
          <div key={key} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {key}
            </div>
            <div className="mt-2 text-3xl font-bold text-navy">{isLoading ? "…" : counts[key]}</div>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-navy">Post terbaru</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/posts">Lihat semua</Link>
          </Button>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Judul</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-muted-foreground">
                    Memuat…
                  </td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-muted-foreground">
                    Belum ada post.
                  </td>
                </tr>
              ) : (
                recent.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/posts/${p.id}`}
                        className="font-medium text-navy hover:underline"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.status}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {new Date(p.updated_at).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AnalyticsPanels({
  analytics,
  dailyChart,
  heatCells,
  heatMax,
  trafficKpis,
  trafficKpisLoading,
  trafficSourceBreakdown,
  trafficTopPages,
  trafficUtmTable,
  dateFromYmd,
  dateToYmd,
  webId,
}: {
  analytics: AdminAnalyticsSummary;
  dailyChart: { dayLabel: string; impressions: number; clicks: number }[];
  heatCells: Map<string, number>;
  heatMax: number;
  trafficKpis: TrafficDashboardKpis | null;
  trafficKpisLoading: boolean;
  trafficSourceBreakdown: TrafficSourceBreakdownRow[];
  trafficTopPages: TrafficTopPagesRow[];
  trafficUtmTable: UtmTrackingRow[];
  dateFromYmd: string;
  dateToYmd: string;
  webId: string;
}) {
  type ClickBreakdownOpen =
    | {
        kind: "source";
        sourceKey: string;
        label: string;
        rowClicks: number;
      }
    | {
        kind: "path";
        path: string;
        rowClicks: number;
      }
    | {
        kind: "utm";
        rowClicks: number;
        titleLine: string;
        rpc: {
          route: string;
          utm_campaign: string;
          utm_source: string;
          utm_medium: string;
          utm_content: string;
          utm_term: string;
          session_id: string;
          session_day: string;
          visitor_id: string | null;
        };
      };

  const [clickBreakdown, setClickBreakdown] = useState<ClickBreakdownOpen | null>(null);

  const clickTargetsQuery = useQuery({
    queryKey: [
      "admin",
      "click-breakdown",
      webId,
      dateFromYmd,
      dateToYmd,
      clickBreakdown?.kind,
      clickBreakdown?.kind === "source"
        ? clickBreakdown.sourceKey
        : clickBreakdown?.kind === "path"
          ? clickBreakdown.path
          : clickBreakdown?.kind === "utm"
            ? [
                clickBreakdown.rpc.route,
                clickBreakdown.rpc.utm_campaign,
                clickBreakdown.rpc.utm_source,
                clickBreakdown.rpc.utm_medium,
                clickBreakdown.rpc.utm_content,
                clickBreakdown.rpc.utm_term,
                clickBreakdown.rpc.session_id,
                clickBreakdown.rpc.session_day,
                clickBreakdown.rpc.visitor_id ?? "",
              ]
            : null,
    ],
    queryFn: async () => {
      if (!clickBreakdown) {
        throw new Error("no modal");
      }
      if (clickBreakdown.kind === "source") {
        return adminFetchClickTargetsForSourceKey(dateFromYmd, dateToYmd, clickBreakdown.sourceKey, 50);
      }
      if (clickBreakdown.kind === "path") {
        return adminFetchClickTargetsForPath(dateFromYmd, dateToYmd, clickBreakdown.path, 50);
      }
      return adminFetchClickTargetsForUtmRow({
        fromYmd: dateFromYmd,
        toYmd: dateToYmd,
        route: clickBreakdown.rpc.route,
        utm_campaign: clickBreakdown.rpc.utm_campaign,
        utm_source: clickBreakdown.rpc.utm_source,
        utm_medium: clickBreakdown.rpc.utm_medium,
        utm_content: clickBreakdown.rpc.utm_content,
        utm_term: clickBreakdown.rpc.utm_term,
        session_id: clickBreakdown.rpc.session_id,
        session_day: clickBreakdown.rpc.session_day,
        visitor_id: clickBreakdown.rpc.visitor_id,
        p_limit: 50,
      });
    },
    enabled: clickBreakdown != null,
  });

  const clickDetailSum = useMemo(() => {
    const rows = clickTargetsQuery.data;
    if (!rows?.length) return 0;
    return rows.reduce((a, r) => a + r.clicks, 0);
  }, [clickTargetsQuery.data]);

  /** Cadangan jika RPC Traffic belum siapa atau gagal: sama seperti sebelumnya. */
  const fallbackPageViews = useMemo(() => {
    if (!dailyChart.length) return analytics.totals.impressions;
    return dailyChart.reduce((a, d) => a + d.impressions, 0);
  }, [dailyChart, analytics.totals.impressions]);

  const fallbackClicks = useMemo(() => {
    if (!dailyChart.length) return analytics.totals.clicks;
    return dailyChart.reduce((a, d) => a + d.clicks, 0);
  }, [dailyChart, analytics.totals.clicks]);

  const [utmFilters, setUtmFilters] = useState<Record<UtmFilterKey, string>>({
    route: UTM_FILTER_ALL,
    utm_campaign: UTM_FILTER_ALL,
    utm_source: UTM_FILTER_ALL,
    utm_medium: UTM_FILTER_ALL,
    utm_content: UTM_FILTER_ALL,
    utm_term: UTM_FILTER_ALL,
  });
  const [utmSortKey, setUtmSortKey] = useState<UtmSortColumn | null>(null);
  const [utmSortDir, setUtmSortDir] = useState<"asc" | "desc">("asc");

  const utmFilterOptions = useMemo(() => {
    const o = {} as Record<UtmFilterKey, string[]>;
    for (const k of UTM_FILTER_KEYS) {
      o[k] = utmColumnOptionValues(trafficUtmTable, k);
    }
    return o;
  }, [trafficUtmTable]);

  useEffect(() => {
    setUtmFilters((prev) => {
      let next: Record<UtmFilterKey, string> | null = null;
      for (const key of UTM_FILTER_KEYS) {
        const valid = new Set<string>([UTM_FILTER_ALL, ...utmFilterOptions[key]]);
        if (!valid.has(prev[key])) {
          if (!next) next = { ...prev };
          next[key] = UTM_FILTER_ALL;
        }
      }
      return next ?? prev;
    });
  }, [trafficUtmTable, utmFilterOptions]);

  const utmFilteredRows = useMemo(() => {
    return trafficUtmTable.filter(
      (r) =>
        matchesUtmFilter(r, "route", utmFilters.route) &&
        matchesUtmFilter(r, "utm_campaign", utmFilters.utm_campaign) &&
        matchesUtmFilter(r, "utm_source", utmFilters.utm_source) &&
        matchesUtmFilter(r, "utm_medium", utmFilters.utm_medium) &&
        matchesUtmFilter(r, "utm_content", utmFilters.utm_content) &&
        matchesUtmFilter(r, "utm_term", utmFilters.utm_term),
    );
  }, [trafficUtmTable, utmFilters]);

  const utmDisplayRows = useMemo(() => {
    if (!utmSortKey) return utmFilteredRows;
    const rows = [...utmFilteredRows];
    const mult = utmSortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => compareUtmSort(a, b, utmSortKey) * mult);
    return rows;
  }, [utmFilteredRows, utmSortKey, utmSortDir]);

  const utmFiltersActive = useMemo(
    () => UTM_FILTER_KEYS.some((k) => utmFilters[k] !== UTM_FILTER_ALL),
    [utmFilters],
  );

  const utmFilteredKpiPageViews = useMemo(
    () => utmFilteredRows.reduce((s, r) => s + r.page_views, 0),
    [utmFilteredRows],
  );
  const utmFilteredKpiClicks = useMemo(
    () => utmFilteredRows.reduce((s, r) => s + r.clicks, 0),
    [utmFilteredRows],
  );

  function cycleUtmSort(column: UtmSortColumn) {
    if (utmSortKey !== column) {
      setUtmSortKey(column);
      setUtmSortDir("asc");
    } else if (utmSortDir === "asc") {
      setUtmSortDir("desc");
    } else {
      setUtmSortKey(null);
      setUtmSortDir("asc");
    }
  }

  const utmSortOrFilterActive = utmFiltersActive || utmSortKey != null;

  const useTraffic = trafficKpis != null;
  const headlineTotalSessions = utmFiltersActive
    ? utmFilteredRows.length
    : useTraffic
      ? trafficKpis.sessions
      : trafficKpisLoading
        ? null
        : analytics.totals.unique_sessions;
  const headlinePageViews = utmFiltersActive
    ? utmFilteredKpiPageViews
    : useTraffic
      ? trafficKpis.page_views
      : trafficKpisLoading
        ? null
        : fallbackPageViews;
  const headlineClicks = utmFiltersActive
    ? utmFilteredKpiClicks
    : useTraffic
      ? trafficKpis.clicks
      : trafficKpisLoading
        ? null
        : fallbackClicks;

  function headlineCell(v: number | null): ReactNode {
    if (v === null) return "…";
    return v;
  }

  const sourceSessionsTotal = useMemo(
    () => trafficSourceBreakdown.reduce((a, r) => a + r.sessions, 0),
    [trafficSourceBreakdown],
  );

  /** Skala panjang bar (nilai absolut sesi); sama urutan baris dengan tabel Sumber traffic. */
  const sessionBarScaleMax = useMemo(() => {
    let m = 1;
    for (const r of trafficSourceBreakdown) {
      if (r.sessions > m) m = r.sessions;
    }
    return m;
  }, [trafficSourceBreakdown]);

  const trafficTotalRowScroll = useMemo(() => {
    let maxDeep: number | null = null;
    let wSum = 0;
    let waSum = 0;
    for (const r of trafficSourceBreakdown) {
      if (r.max_deep_scroll_pct != null && Number.isFinite(r.max_deep_scroll_pct)) {
        maxDeep =
          maxDeep === null
            ? r.max_deep_scroll_pct
            : Math.max(maxDeep, r.max_deep_scroll_pct);
      }
      if (
        r.avg_max_deep_scroll_pct != null &&
        Number.isFinite(r.avg_max_deep_scroll_pct) &&
        r.sessions > 0
      ) {
        wSum += r.sessions;
        waSum += r.avg_max_deep_scroll_pct * r.sessions;
      }
    }
    const avgMaxDeep = wSum > 0 ? waSum / wSum : null;
    return { maxDeep, avgMaxDeep: avgMaxDeep };
  }, [trafficSourceBreakdown]);

  const trafficTopPagesSite = useMemo(
    () => trafficTopPages.filter((p) => !isTrafficBlogPath(p.path)),
    [trafficTopPages],
  );
  const trafficTopPagesBlog = useMemo(
    () => trafficTopPages.filter((p) => isTrafficBlogPath(p.path)),
    [trafficTopPages],
  );

  return (
    <div className="mt-6 min-w-0 space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
          <div className="text-xs font-normal text-muted-foreground">Total sessions</div>
          <div className="mt-2 text-3xl font-bold text-foreground">{headlineCell(headlineTotalSessions)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
          <div className="text-xs font-normal text-muted-foreground">All Page Views</div>
          <div className="mt-2 text-3xl font-bold text-foreground">{headlineCell(headlinePageViews)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
          <div className="text-xs font-normal text-muted-foreground">Clicks</div>
          <div className="mt-2 text-3xl font-bold text-foreground">{headlineCell(headlineClicks)}</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-navy">Impressions vs klik per hari</h3>
        <div className="mt-3 h-[280px] w-full min-w-0">
          {dailyChart.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="impressions"
                  name="Impressions"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  name="Klik"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada data di rentang ini.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col overflow-x-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="shrink-0 border-b border-border px-4 py-3 md:px-5">
          <h3 className="text-base font-semibold text-navy">Sumber traffic</h3>
        </div>
        <div className="min-w-0 overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_hsl(var(--border))]">
              <tr>
                <th className="px-4 py-3 font-medium md:px-5">Sumber</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Sessions</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">% of total</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Page views</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Clicks</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Max deep</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Avg max deep</th>
              </tr>
            </thead>
            <tbody>
              {trafficKpisLoading && trafficSourceBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Memuat…
                  </td>
                </tr>
              ) : trafficSourceBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Belum ada data sumber di rentang ini.
                  </td>
                </tr>
              ) : (
                <>
                  {trafficSourceBreakdown.map((r) => {
                    const pct =
                      sourceSessionsTotal > 0
                        ? Math.round((100 * r.sessions) / sourceSessionsTotal)
                        : 0;
                    return (
                      <tr key={r.key} className="border-b border-border/60">
                        <td className="px-4 py-3 font-medium text-navy md:px-5">
                          {trafficSourceShortLabel(r.key)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums md:px-5">{r.sessions}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground md:px-5">
                          {pct}%
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums md:px-5">{r.page_views}</td>
                        <td className="px-4 py-3 text-right md:px-5">
                          {r.clicks > 0 ? (
                            <button
                              type="button"
                              className="tabular-nums font-medium text-primary underline-offset-2 hover:underline"
                              onClick={() =>
                                setClickBreakdown({
                                  kind: "source",
                                  sourceKey: r.key,
                                  label: trafficSourceShortLabel(r.key),
                                  rowClicks: r.clicks,
                                })
                              }
                            >
                              {r.clicks}
                            </button>
                          ) : (
                            <span className="tabular-nums text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums md:px-5">
                          {formatScrollPct(r.max_deep_scroll_pct)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums md:px-5">
                          {formatScrollPct(r.avg_max_deep_scroll_pct)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted/20 font-medium">
                    <td className="px-4 py-3 text-navy md:px-5">Total</td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {trafficKpis != null ? trafficKpis.sessions : sourceSessionsTotal}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">100%</td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {trafficKpis != null ? trafficKpis.page_views : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-primary md:px-5">
                      {trafficKpis != null ? trafficKpis.clicks : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatScrollPct(trafficTotalRowScroll.maxDeep)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatScrollPct(trafficTotalRowScroll.avgMaxDeep)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        </div>

        <div className="flex flex-col overflow-x-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="shrink-0 border-b border-border px-4 py-3 md:px-5">
          <h3 className="text-base font-semibold text-navy">Sessions per sumber</h3>
        </div>
        <div className="min-w-0 overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[260px] text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_hsl(var(--border))]">
              <tr>
                <th className="px-4 py-3 font-medium md:px-5">Sumber</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {trafficKpisLoading && trafficSourceBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Memuat…
                  </td>
                </tr>
              ) : trafficSourceBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Belum ada data sumber di rentang ini.
                  </td>
                </tr>
              ) : (
                <>
                  {trafficSourceBreakdown.map((r) => {
                    const pct = Math.min(100, Math.round((100 * r.sessions) / sessionBarScaleMax));
                    return (
                      <tr key={r.key} className="border-b border-border/60">
                        <td className="px-4 py-3 font-medium text-navy md:px-5">
                          {trafficSourceShortLabel(r.key)}
                        </td>
                        <td className="px-4 py-3 md:px-5">
                          <div className="flex items-center justify-end gap-3">
                            <div className="min-h-3 min-w-[6rem] flex-1">
                              <div className="h-3 w-full overflow-hidden rounded-r-md bg-muted/80">
                                <div
                                  className="h-full min-w-0 rounded-r-md bg-primary"
                                  style={{ width: `${pct}%` }}
                                  role="presentation"
                                />
                              </div>
                            </div>
                            <span className="w-9 shrink-0 text-right tabular-nums">{r.sessions}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted/20 font-medium">
                    <td className="px-4 py-3 text-navy md:px-5">Total</td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {trafficKpis != null ? trafficKpis.sessions : sourceSessionsTotal}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <div className="flex flex-col overflow-x-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-navy">Top pages</h3>
          </div>
          <span className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs tabular-nums text-muted-foreground">
            {trafficTopPagesSite.length} item
          </span>
        </div>
        <div className="min-w-0 overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_hsl(var(--border))]">
              <tr>
                <th className="px-4 py-3 font-medium md:px-5">Path</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Impr</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Sesi unik</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Klik</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Median aktif</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Rata-rata</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Max deep</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Avg max deep</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">n</th>
              </tr>
            </thead>
            <tbody>
              {trafficKpisLoading && trafficTopPagesSite.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Memuat…
                  </td>
                </tr>
              ) : trafficTopPagesSite.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Belum ada page view (non-blog) di rentang ini.
                  </td>
                </tr>
              ) : (
                trafficTopPagesSite.map((r) => (
                  <tr key={r.path} className="border-b border-border/60">
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-navy md:px-5" title={r.path}>
                      {r.path}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">{r.impr}</td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">{r.unique_sessions}</td>
                    <td className="px-4 py-3 text-right md:px-5">
                      {r.clicks > 0 ? (
                        <button
                          type="button"
                          className="tabular-nums font-medium text-primary underline-offset-2 hover:underline"
                          onClick={() =>
                            setClickBreakdown({
                              kind: "path",
                              path: r.path,
                              rowClicks: r.clicks,
                            })
                          }
                        >
                          {r.clicks}
                        </button>
                      ) : (
                        <span className="tabular-nums text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatActiveSecondsShort(r.median_active_ms)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatActiveSecondsShort(r.avg_active_ms)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatScrollPct(r.max_deep_scroll_pct)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatScrollPct(r.avg_max_deep_scroll_pct)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground md:px-5">{r.n}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>

        <div className="flex flex-col overflow-x-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-navy">Top blog pages</h3>
          </div>
          <span className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs tabular-nums text-muted-foreground">
            {trafficTopPagesBlog.length} item
          </span>
        </div>
        <div className="min-w-0 overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_hsl(var(--border))]">
              <tr>
                <th className="px-4 py-3 font-medium md:px-5">Path</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Impr</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Sesi unik</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Klik</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Median aktif</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Rata-rata</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Max deep</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">Avg max deep</th>
                <th className="px-4 py-3 text-right font-medium md:px-5">n</th>
              </tr>
            </thead>
            <tbody>
              {trafficKpisLoading && trafficTopPagesBlog.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Memuat…
                  </td>
                </tr>
              ) : trafficTopPagesBlog.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Belum ada page view blog di rentang ini.
                  </td>
                </tr>
              ) : (
                trafficTopPagesBlog.map((r) => (
                  <tr key={r.path} className="border-b border-border/60">
                    <td className="max-w-[280px] truncate px-4 py-3 font-mono text-xs text-navy md:px-5" title={r.path}>
                      {r.path}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">{r.impr}</td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">{r.unique_sessions}</td>
                    <td className="px-4 py-3 text-right md:px-5">
                      {r.clicks > 0 ? (
                        <button
                          type="button"
                          className="tabular-nums font-medium text-primary underline-offset-2 hover:underline"
                          onClick={() =>
                            setClickBreakdown({
                              kind: "path",
                              path: r.path,
                              rowClicks: r.clicks,
                            })
                          }
                        >
                          {r.clicks}
                        </button>
                      ) : (
                        <span className="tabular-nums text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatActiveSecondsShort(r.median_active_ms)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatActiveSecondsShort(r.avg_active_ms)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatScrollPct(r.max_deep_scroll_pct)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatScrollPct(r.avg_max_deep_scroll_pct)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground md:px-5">{r.n}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-navy">UTM tracking</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {utmSortOrFilterActive ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setUtmFilters({
                    route: UTM_FILTER_ALL,
                    utm_campaign: UTM_FILTER_ALL,
                    utm_source: UTM_FILTER_ALL,
                    utm_medium: UTM_FILTER_ALL,
                    utm_content: UTM_FILTER_ALL,
                    utm_term: UTM_FILTER_ALL,
                  });
                  setUtmSortKey(null);
                  setUtmSortDir("asc");
                }}
              >
                Reset filter &amp; sort
              </Button>
            ) : null}
            <span className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs tabular-nums text-muted-foreground">
              {utmDisplayRows.length}
              {trafficUtmTable.length !== utmDisplayRows.length ? (
                <span className="text-muted-foreground"> / {trafficUtmTable.length}</span>
              ) : null}{" "}
              rows
            </span>
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-border bg-muted/30 shadow-[0_1px_0_hsl(var(--border))]">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 md:px-4">
                  <UtmSortHeaderBtn
                    label="waktu"
                    column="occurred_at"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                  />
                </th>
                <th className="px-3 py-2 md:px-4">
                  <UtmSortHeaderBtn
                    label="route"
                    column="route"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                  />
                </th>
                <th className="px-3 py-2 md:px-4">
                  <UtmSortHeaderBtn
                    label="utm_campaign"
                    column="utm_campaign"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                  />
                </th>
                <th className="px-3 py-2 md:px-4">
                  <UtmSortHeaderBtn
                    label="utm_source"
                    column="utm_source"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                  />
                </th>
                <th className="px-3 py-2 md:px-4">
                  <UtmSortHeaderBtn
                    label="utm_medium"
                    column="utm_medium"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                  />
                </th>
                <th className="px-3 py-2 md:px-4">
                  <UtmSortHeaderBtn
                    label="utm_content"
                    column="utm_content"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                  />
                </th>
                <th className="px-3 py-2 md:px-4">
                  <UtmSortHeaderBtn
                    label="utm_term"
                    column="utm_term"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                  />
                </th>
                <th className="px-3 py-2 text-right md:px-4">
                  <UtmSortHeaderBtn
                    label="page_views"
                    column="page_views"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                    align="right"
                  />
                </th>
                <th className="px-3 py-2 text-right md:px-4">
                  <UtmSortHeaderBtn
                    label="clicks"
                    column="clicks"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                    align="right"
                  />
                </th>
                <th className="px-3 py-2 text-right md:px-4">
                  <UtmSortHeaderBtn
                    label="max_deep_scroll"
                    column="max_deep_scroll_pct"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                    align="right"
                  />
                </th>
                <th className="px-3 py-2 text-right md:px-4">
                  <UtmSortHeaderBtn
                    label="avg_max_deep_scroll"
                    column="avg_max_deep_scroll_pct"
                    sortKey={utmSortKey}
                    sortDir={utmSortDir}
                    onCycle={cycleUtmSort}
                    align="right"
                  />
                </th>
              </tr>
              <tr className="border-t border-border/60 bg-muted/20">
                <th className="px-3 py-2 md:px-4" aria-hidden />
                {UTM_FILTER_KEYS.map((key) => (
                  <th key={key} className="px-2 py-2 md:px-3">
                    <Select
                      value={utmFilters[key]}
                      onValueChange={(v) => setUtmFilters((f) => ({ ...f, [key]: v }))}
                    >
                      <SelectTrigger className="h-8 min-w-[5rem] max-w-[11rem] text-xs">
                        <SelectValue placeholder="Semua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UTM_FILTER_ALL}>Semua</SelectItem>
                        {utmFilterOptions[key].map((opt) =>
                          opt === UTM_FILTER_EMPTY ? (
                            <SelectItem key={`${key}-empty`} value={UTM_FILTER_EMPTY}>
                              (kosong)
                            </SelectItem>
                          ) : (
                            <SelectItem key={`${key}-${opt.slice(0, 48)}`} value={opt}>
                              <span className="block max-w-[260px] truncate" title={opt}>
                                {opt}
                              </span>
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </th>
                ))}
                <th className="px-3 py-2 md:px-4" colSpan={4} aria-hidden />
              </tr>
            </thead>
            <tbody>
              {trafficKpisLoading && trafficUtmTable.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Memuat…
                  </td>
                </tr>
              ) : trafficUtmTable.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Tidak ada baris UTM di rentang ini.
                  </td>
                </tr>
              ) : utmDisplayRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground md:px-5">
                    Tidak ada baris yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                utmDisplayRows.map((r) => (
                  <tr key={`${r.visit_key}-${r.occurred_at}`} className="border-b border-border/60">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground md:px-5">{r.time_label}</td>
                    <td className="max-w-[100px] truncate px-4 py-3 font-mono text-xs md:px-5" title={r.route ?? ""}>
                      {utmCellRaw(r.route) === "" ? "—" : r.route}
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3 md:px-5" title={r.utm_campaign ?? ""}>
                      {utmCellRaw(r.utm_campaign) === "" ? "—" : r.utm_campaign}
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3 md:px-5" title={r.utm_source ?? ""}>
                      {utmCellRaw(r.utm_source) === "" ? "—" : r.utm_source}
                    </td>
                    <td className="max-w-[100px] truncate px-4 py-3 md:px-5" title={r.utm_medium ?? ""}>
                      {utmCellRaw(r.utm_medium) === "" ? "—" : r.utm_medium}
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3 md:px-5" title={r.utm_content ?? ""}>
                      {utmCellRaw(r.utm_content) === "" ? "—" : r.utm_content}
                    </td>
                    <td className="max-w-[100px] truncate px-4 py-3 md:px-5" title={r.utm_term ?? ""}>
                      {utmCellRaw(r.utm_term) === "" ? "—" : r.utm_term}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">{r.page_views}</td>
                    <td className="px-4 py-3 text-right md:px-5">
                      {r.clicks > 0 ? (
                        <button
                          type="button"
                          className="tabular-nums font-medium text-primary underline-offset-2 hover:underline"
                          onClick={() =>
                            setClickBreakdown({
                              kind: "utm",
                              rowClicks: r.clicks,
                              titleLine: `${r.time_label} · ${r.route ?? "/"}`,
                              rpc: {
                                route: r.route ?? "",
                                utm_campaign: r.utm_campaign ?? "",
                                utm_source: r.utm_source ?? "",
                                utm_medium: r.utm_medium ?? "",
                                utm_content: r.utm_content ?? "",
                                utm_term: r.utm_term ?? "",
                                session_id: r.session_id,
                                session_day: r.day || dateFromYmd,
                                visitor_id: r.visitor_id,
                              },
                            })
                          }
                        >
                          {r.clicks}
                        </button>
                      ) : (
                        <span className="tabular-nums text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatScrollPct(r.max_deep_scroll_pct)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums md:px-5">
                      {formatScrollPct(r.avg_max_deep_scroll_pct)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={clickBreakdown != null}
        onOpenChange={(open) => {
          if (!open) setClickBreakdown(null);
        }}
      >
        <DialogContent className="flex h-[min(92vmin,52rem)] w-[min(92vmin,52rem)] max-h-[min(92vmin,52rem)] max-w-none flex-col gap-3 overflow-hidden rounded-none border-2 p-5 sm:max-w-none sm:rounded-none">
          <DialogHeader className="shrink-0 gap-1 space-y-0 text-left">
            <DialogTitle className="text-base">
              {clickBreakdown?.kind === "source"
                ? `Detail klik — ${clickBreakdown.label}`
                : clickBreakdown?.kind === "path"
                  ? `Detail klik — ${clickBreakdown.path}`
                  : "Detail klik"}
            </DialogTitle>
            <DialogDescription className="space-y-1 text-xs text-muted-foreground">
              {clickBreakdown?.kind === "utm" ? (
                <span className="block">{clickBreakdown.titleLine}</span>
              ) : null}
              <span className="block">
                {dateFromYmd} – {dateToYmd}
              </span>
            </DialogDescription>
          </DialogHeader>
          {clickTargetsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Memuat detail…</p>
          ) : clickTargetsQuery.isError ? (
            <p className="text-sm text-destructive">{(clickTargetsQuery.error as Error).message}</p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="min-h-0 flex-1 overflow-auto no-scrollbar rounded-none border border-border">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="sticky top-0 z-[1] border-b border-border bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Clicks</th>
                      <th className="px-3 py-2 font-medium">Sesi unik</th>
                      <th className="px-3 py-2 font-medium">track_key</th>
                      <th className="px-3 py-2 font-medium">Tipe</th>
                      <th className="px-3 py-2 font-medium">Label</th>
                      <th className="px-3 py-2 font-medium">target_url</th>
                      <th className="px-3 py-2 font-medium">Internal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!clickTargetsQuery.data?.length ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-muted-foreground">
                          Tidak ada baris (atau tidak ada akses / rentang tidak valid).
                        </td>
                      </tr>
                    ) : (
                      clickTargetsQuery.data.map((row, i) => (
                        <tr key={`${row.track_key ?? ""}-${row.target_url ?? ""}-${i}`} className="border-t border-border/60">
                          <td className="px-3 py-2 tabular-nums">{row.clicks}</td>
                          <td className="px-3 py-2 tabular-nums">{row.unique_sessions}</td>
                          <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[11px]" title={row.track_key ?? ""}>
                            {row.track_key ?? "—"}
                          </td>
                          <td className="px-3 py-2">{row.element_type ?? "—"}</td>
                          <td className="max-w-[140px] truncate px-3 py-2" title={row.element_label ?? ""}>
                            {row.element_label ?? "—"}
                          </td>
                          <td className="max-w-[200px] truncate px-3 py-2 text-[11px]" title={row.target_url ?? ""}>
                            {row.target_url ? (
                              <a
                                href={row.target_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline-offset-2 hover:underline"
                              >
                                {row.target_url}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2">{row.is_internal ? "Ya" : "Tidak"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {clickBreakdown != null && clickTargetsQuery.data?.length ? (
                <p className="shrink-0 text-xs text-muted-foreground">
                  Total klik: <strong className="text-foreground">{clickDetailSum}</strong>
                  {clickDetailSum !== clickBreakdown.rowClicks ? (
                    <span className="text-muted-foreground">
                      {" "}
                      / sumber: {clickBreakdown.rowClicks}
                      {clickDetailSum < clickBreakdown.rowClicks ? " (top 50 target)" : null}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div>
        <h3 className="text-sm font-semibold text-navy">Heatmap durasi (bucket × jam WIB)</h3>
        <div className="mt-2 overflow-x-auto no-scrollbar">
          <div className="inline-block min-w-[720px] rounded-lg border border-border p-2">
            <div className="grid" style={{ gridTemplateColumns: `64px repeat(24, minmax(0,1fr))` }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="px-0.5 py-1 text-center text-[10px] text-muted-foreground">
                  {h}
                </div>
              ))}
              {HEAT_BUCKETS.map((bucket) => (
                <Fragment key={bucket}>
                  <div className="flex items-center py-1 text-[10px] font-medium text-navy">
                    {bucket}
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const v = heatCells.get(`${bucket}-${hour}`) ?? 0;
                    return (
                      <div
                        key={`${bucket}-${hour}`}
                        className={cn("m-0.5 min-h-[22px] rounded-sm border border-border/40")}
                        style={{ backgroundColor: heatColor(v, heatMax) }}
                        title={`${bucket} @${hour}h — ${formatMs(v)}`}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
