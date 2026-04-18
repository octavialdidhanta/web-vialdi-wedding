import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAnalyticsDashboardRealtime } from "@/admin/hooks/useAnalyticsDashboardRealtime";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminFetchPosts } from "@/blog/supabaseBlog";
import {
  adminFetchAnalyticsSummary,
  jakartaDayRangeToIso,
  jakartaDaysAgoYmd,
  jakartaTodayYmd,
  type AdminAnalyticsSummary,
} from "@/admin/lib/analyticsAdmin";
import { Button } from "@/share/ui/button";
import { Input } from "@/share/ui/input";
import { Label } from "@/share/ui/label";
import { cn } from "@/share/lib/utils";

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
  if (!Number.isFinite(ms) || ms <= 0) {
    return "—";
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

export function AdminDashboardPage() {
  const defaultTo = jakartaTodayYmd();
  const defaultFrom = jakartaDaysAgoYmd(6);
  const [fromYmd, setFromYmd] = useState(defaultFrom);
  const [toYmd, setToYmd] = useState(defaultTo);

  const rangeIso = useMemo(() => jakartaDayRangeToIso(fromYmd, toYmd), [fromYmd, toYmd]);

  useAnalyticsDashboardRealtime(true);

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: adminFetchPosts,
  });

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ["admin", "analytics", rangeIso.p_from, rangeIso.p_to],
    queryFn: () => adminFetchAnalyticsSummary(rangeIso.p_from, rangeIso.p_to),
    staleTime: 0,
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

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
          Rentang tanggal (kalender Asia/Jakarta). Pastikan migrasi{" "}
          <code className="text-xs">admin_analytics_summary</code> dan Edge Function{" "}
          <code className="text-xs">analytics-ingest</code> sudah aktif.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="an-from">Dari</Label>
            <Input
              id="an-from"
              type="date"
              value={fromYmd}
              onChange={(e) => setFromYmd(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-to">Sampai</Label>
            <Input
              id="an-to"
              type="date"
              value={toYmd}
              onChange={(e) => setToYmd(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>

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
}: {
  analytics: AdminAnalyticsSummary;
  dailyChart: { dayLabel: string; impressions: number; clicks: number }[];
  heatCells: Map<string, number>;
  heatMax: number;
}) {
  const svc = analytics.service;
  return (
    <div className="mt-6 space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="text-xs font-medium text-muted-foreground">Impressions (page views)</div>
          <div className="mt-1 text-2xl font-bold text-navy">{analytics.totals.impressions}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="text-xs font-medium text-muted-foreground">Klik tercatat</div>
          <div className="mt-1 text-2xl font-bold text-navy">{analytics.totals.clicks}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="text-xs font-medium text-muted-foreground">Sesi unik (est.)</div>
          <div className="mt-1 text-2xl font-bold text-navy">
            {analytics.totals.unique_sessions}
          </div>
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
                <Tooltip />
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

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-navy">Top 10 halaman (impressions)</h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Path</th>
                  <th className="px-3 py-2 font-medium">Impressions</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_paths.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-4 text-muted-foreground">
                      —
                    </td>
                  </tr>
                ) : (
                  analytics.top_paths.map((r) => (
                    <tr key={r.path} className="border-t border-border/60">
                      <td className="max-w-[200px] truncate px-3 py-2 font-mono text-[11px]">
                        {r.path}
                      </td>
                      <td className="px-3 py-2">{r.impressions}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-navy">Top 5 track key (CTR global)</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            CTR = klik key / total impressions situs.
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Klik</th>
                  <th className="px-3 py-2 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_track_keys.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-muted-foreground">
                      —
                    </td>
                  </tr>
                ) : (
                  analytics.top_track_keys.map((r) => (
                    <tr key={r.track_key} className="border-t border-border/60">
                      <td className="px-3 py-2 font-mono">{r.track_key}</td>
                      <td className="px-3 py-2">{r.clicks}</td>
                      <td className="px-3 py-2">{(Number(r.ctr) * 100).toFixed(2)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-navy">Top 5 artikel blog (traffic)</h3>
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Judul</th>
                  <th className="px-3 py-2 font-medium">Impr.</th>
                  <th className="px-3 py-2 font-medium">Avg aktif</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_blog.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-muted-foreground">
                      —
                    </td>
                  </tr>
                ) : (
                  analytics.top_blog.map((r) => (
                    <tr key={r.path} className="border-t border-border/60">
                      <td className="max-w-[220px] px-3 py-2">
                        <div className="truncate font-medium text-navy">{r.title || r.path}</div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">
                          {r.path}
                        </div>
                      </td>
                      <td className="px-3 py-2">{r.impressions}</td>
                      <td className="px-3 py-2">{formatMs(r.avg_active_ms)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <h3 className="text-sm font-semibold text-navy">Halaman /service</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Impressions</dt>
              <dd className="font-semibold text-navy">{svc?.impressions ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Klik contact (di /service)</dt>
              <dd className="font-semibold text-navy">{svc?.contact_clicks_on_service ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Konversi</dt>
              <dd className="font-semibold text-navy">
                {svc?.impressions ? `${(Number(svc.conversion) * 100).toFixed(2)}%` : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-navy">Rata-rata durasi aktif per path</h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Path</th>
                <th className="px-3 py-2 font-medium">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {analytics.duration_by_path.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-4 text-muted-foreground">
                    —
                  </td>
                </tr>
              ) : (
                analytics.duration_by_path.map((r) => (
                  <tr key={r.path} className="border-t border-border/60">
                    <td className="max-w-[240px] truncate px-3 py-2 font-mono text-[11px]">
                      {r.path}
                    </td>
                    <td className="px-3 py-2">{formatMs(r.avg_ms)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-navy">Heatmap durasi (bucket × jam WIB)</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Intensitas = rata-rata active_ms pada kombinasi tersebut.
        </p>
        <div className="mt-2 overflow-x-auto">
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
