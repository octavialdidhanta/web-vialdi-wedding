import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAnalyticsDashboardRealtime } from "@/admin/hooks/useAnalyticsDashboardRealtime";
import {
  Bar,
  BarChart,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/share/ui/tooltip";
import { cn } from "@/share/lib/utils";
import { Info } from "lucide-react";

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

/** Judul kolom tabel + ikon info (tooltip bahasa awam). */
function TableMetricHeader({
  label,
  help,
  className,
}: {
  label: string;
  help: ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-3 py-2 font-medium", className)}>
      <div className="inline-flex max-w-full items-center gap-1">
        <span>{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 rounded-full text-muted-foreground transition-colors hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              aria-label={`Penjelasan kolom ${label}`}
            >
              <Info className="size-3.5" strokeWidth={2} aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[min(20rem,calc(100vw-2rem))] text-left text-xs font-normal leading-relaxed text-balance"
          >
            {help}
          </TooltipContent>
        </Tooltip>
      </div>
    </th>
  );
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
  const webId = useMemo(() => getRequiredWebId(), []);

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
    queryKey: ["admin", "analytics", webId, rangeIso.p_from, rangeIso.p_to],
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

  const acquisitionTotalSessions = useMemo(
    () => analytics.acquisition_channels.reduce((acc, r) => acc + r.sessions, 0),
    [analytics.acquisition_channels],
  );

  const acquisitionBarHeight = useMemo(() => {
    const n = analytics.acquisition_channels.length;
    return Math.max(100, Math.min(380, 20 * n + 48));
  }, [analytics.acquisition_channels.length]);

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

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-navy">Top 10 halaman</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Sepuluh alamat yang paling sering dibuka di rentang tanggal di atas. Klik ikon{" "}
              <Info className="inline size-3 align-text-bottom opacity-70" aria-hidden /> di judul kolom untuk
              penjelasan singkat tiap angka.
            </p>
            <TooltipProvider delayDuration={200}>
              <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <TableMetricHeader
                        label="Path"
                        help="Alamat halaman di situs Anda, contoh /contact atau /. Angka lain di baris ini merujuk ke alamat yang sama."
                      />
                      <TableMetricHeader
                        className="whitespace-nowrap"
                        label="Impr."
                        help={
                          <>
                            <strong>Impressions</strong> = berapa kali halaman ini tampil/dibuka. Satu orang bisa
                            membuka halaman yang sama beberapa kali; tiap bukaan biasanya dihitung terpisah, jadi
                            angka ini bisa lebih besar dari jumlah pengunjung.
                          </>
                        }
                      />
                      <TableMetricHeader
                        className="whitespace-nowrap"
                        label="Sesi unik"
                        help={
                          <>
                            Perkiraan <strong>berapa pengunjung berbeda</strong> (lewat ID sesi per peramban) yang
                            pernah membuka halaman ini di rentang tanggal. Kalau orang yang sama membuka beberapa
                            kali dalam sesi yang sama, tetap dihitung satu untuk kolom ini.
                          </>
                        }
                      />
                      <TableMetricHeader
                        className="whitespace-nowrap"
                        label="Klik"
                        help={
                          <>
                            Berapa kali ada <strong>klik</strong> (tombol, tautan, dll.) yang tercatat saat
                            pengguna sedang berada di halaman dengan alamat ini. Ini jumlah klik, bukan persen.
                          </>
                        }
                      />
                      <TableMetricHeader
                        className="whitespace-nowrap"
                        label="Median aktif"
                        help={
                          <>
                            <strong>Median</strong> waktu aktif di layar: bayangkan semua kunjungan yang punya
                            data durasi diurut dari terpendek ke terpanjang—median adalah nilai di tengah. Lebih
                            “adil” daripada rata-rata kalau ada satu orang yang sangat lama di halaman. Hanya
                            memakai kunjungan yang sama dengan kolom <strong>n</strong>. Ditampilkan dalam detik
                            (dtk), dibulatkan.
                          </>
                        }
                      />
                      <TableMetricHeader
                        className="whitespace-nowrap"
                        label="Rata-rata"
                        help={
                          <>
                            <strong>Rata-rata</strong> waktu aktif dari kunjungan-kunjungan yang dipakai di kolom{" "}
                            <strong>n</strong>. Kalau satu kunjungan sangat panjang, angka ini bisa jauh lebih besar
                            dari median—bandingkan kedua kolom untuk melihat apakah ada “pencilan”.
                          </>
                        }
                      />
                      <TableMetricHeader
                        className="whitespace-nowrap"
                        label="n"
                        help={
                          <>
                            Huruf <strong>n</strong> artinya <strong>berapa kunjungan</strong> yang dipakai untuk
                            menghitung median dan rata-rata aktif. Hanya kunjungan yang sudah punya catatan durasi
                            (misalnya tab ditutup atau waktu aktif sudah tercatat). Angkanya boleh lebih kecil dari
                            Impr. kalau sebagian kunjungan belum sempat selesai terekam.
                          </>
                        }
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_paths.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-muted-foreground">
                          —
                        </td>
                      </tr>
                    ) : (
                      analytics.top_paths.map((r) => (
                        <tr key={r.path} className="border-t border-border/60">
                          <td className="max-w-[160px] truncate px-3 py-2 font-mono text-[11px]">{r.path}</td>
                          <td className="px-3 py-2 tabular-nums">{r.impressions}</td>
                          <td className="px-3 py-2 tabular-nums">{r.unique_sessions}</td>
                          <td className="px-3 py-2 tabular-nums">{r.path_clicks}</td>
                          <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                            {r.median_active_ms != null ? formatMs(r.median_active_ms) : "—"}
                          </td>
                          <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                            {r.avg_active_ms != null ? formatMs(r.avg_active_ms) : "—"}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">{r.duration_n}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TooltipProvider>
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

        <div className="min-w-0">
          <div className="rounded-lg border border-border bg-card/40 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-navy">Traffic acquisition</h3>
                <p className="mt-0.5 max-w-2xl text-[11px] text-muted-foreground">
                  Perkiraan sumber sesi (satu label per sesi yang punya aktivitas di rentang ini). UTM dan
                  parameter iklan dibaca saat kunjungan pertama di tab; referrer memakai halaman asal di browser.
                  Bukan replika GA4: pencarian organik vs iklan Google tidak terpisah tanpa UTM atau click id.
                </p>
              </div>
              <TooltipProvider delayDuration={200}>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Bantuan</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex shrink-0 rounded-full text-muted-foreground transition-colors hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                        aria-label="Penjelasan traffic acquisition"
                      >
                        <Info className="size-3.5" strokeWidth={2} aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="max-w-[min(22rem,calc(100vw-2rem))] text-left text-xs font-normal leading-relaxed text-balance"
                    >
                      <strong>Direct</strong>: tidak ada referrer dan tidak ada UTM/click id di URL landing.{" "}
                      <strong>Organic search</strong>: referrer dari domain mesin pencari umum.{" "}
                      <strong>Paid</strong>: hadirnya <code className="text-[10px]">gclid</code> /{" "}
                      <code className="text-[10px]">fbclid</code> / <code className="text-[10px]">msclkid</code>{" "}
                      atau nilai <code className="text-[10px]">utm_medium</code> yang mengindikasikan iklan.
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>

            <div className="mt-6 flex min-w-0 flex-col gap-8">
              <div className="min-w-0">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sesi per channel
                </h4>
                {analytics.acquisition_channels.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">Belum ada data sesi di rentang ini.</p>
                ) : (
                  <>
                    <div className="mt-2 w-full min-w-0" style={{ height: acquisitionBarHeight }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={analytics.acquisition_channels}
                          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                          <YAxis
                            type="category"
                            dataKey="channel"
                            width={118}
                            tick={{ fontSize: 11 }}
                            interval={0}
                          />
                          <RechartsTooltip />
                          <Bar
                            dataKey="sessions"
                            name="Sesi"
                            fill="#64748b"
                            fillOpacity={0.9}
                            radius={[0, 4, 4, 0]}
                            maxBarSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2 font-medium">Channel</th>
                            <th className="px-3 py-2 font-medium">Sesi</th>
                            <th className="px-3 py-2 font-medium">% dari total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.acquisition_channels.map((r) => (
                            <tr key={r.channel} className="border-t border-border/60">
                              <td className="px-3 py-2 text-navy">{r.channel}</td>
                              <td className="px-3 py-2 tabular-nums">{r.sessions}</td>
                              <td className="px-3 py-2 tabular-nums text-muted-foreground">
                                {acquisitionTotalSessions > 0
                                  ? `${((100 * r.sessions) / acquisitionTotalSessions).toFixed(1)}%`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              <div className="min-w-0 border-t border-border/60 pt-8">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Top kampanye UTM
                </h4>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Hanya baris dengan <code className="text-[10px]">utm_campaign</code> terisi; diurutkan jumlah
                  sesi unik.
                </p>
                <div className="mt-2 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">utm_campaign</th>
                        <th className="px-3 py-2 font-medium">utm_source</th>
                        <th className="px-3 py-2 font-medium">utm_medium</th>
                        <th className="px-3 py-2 font-medium">Sesi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.acquisition_top_campaigns.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-muted-foreground">
                            —
                          </td>
                        </tr>
                      ) : (
                        analytics.acquisition_top_campaigns.map((r, i) => (
                          <tr key={`${r.utm_campaign}-${r.utm_source}-${r.utm_medium}-${i}`} className="border-t border-border/60">
                            <td className="max-w-[140px] truncate px-3 py-2 font-medium text-navy" title={r.utm_campaign}>
                              {r.utm_campaign || "—"}
                            </td>
                            <td className="max-w-[100px] truncate px-3 py-2" title={r.utm_source}>
                              {r.utm_source || "—"}
                            </td>
                            <td className="max-w-[100px] truncate px-3 py-2" title={r.utm_medium}>
                              {r.utm_medium || "—"}
                            </td>
                            <td className="px-3 py-2 tabular-nums">{r.sessions}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
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
