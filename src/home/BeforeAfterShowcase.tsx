import type { LucideIcon } from "lucide-react";
import { BarChart3, BadgeCheck, MousePointerClick, Sparkles, Target } from "lucide-react";

type Point = { title: string; description: string; icon: LucideIcon; wideOnDesktop?: boolean };

const points: Point[] = [
  {
    title: "Fokus KPI",
    description: "Mulai dari tujuan yang jelas: lead, conversion rate, dan cost per result.",
    icon: Target,
  },
  {
    title: "Creative yang “ngena”",
    description: "Hook, angle, dan visual dibuat untuk mendorong klik dan intent.",
    icon: Sparkles,
  },
  {
    title: "Landing page siap konversi",
    description: "Pesan singkat, bukti sosial, dan CTA jelas agar prospek tidak ragu.",
    icon: MousePointerClick,
  },
  {
    title: "Optimasi berbasis data",
    description: "Testing terjadwal, insight terdokumentasi, dan improvement konsisten.",
    icon: BarChart3,
  },
  {
    title: "Checklist sebelum scale",
    description: "Tracking beres, funnel tidak bocor, dan proses follow-up siap—baru kita scale budget.",
    icon: BadgeCheck,
    wideOnDesktop: true,
  },
];

/**
 * Slider di-update lewat DOM (bukan setState) agar geser tidak memicu re-render React.
 * Gambar dimuat setelah figure mendekati viewport — file before/after sebaiknya < ~500KB per file untuk web.
 */
export function BeforeAfterShowcase() {
  return (
    <div className="min-w-0 w-full">
      <h2 className="text-center font-wedding-serif text-2xl font-bold leading-tight tracking-tight text-navy md:text-3xl lg:text-left">
        <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground md:text-base">
          Performa
        </span>
        Before &amp; After
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground md:text-base lg:mx-0 lg:max-w-none lg:text-left">
        Lihat perbandingan sebelum &amp; sesudah optimasi: creative, landing page, dan funnel yang
        lebih jelas untuk mendorong leads dan konversi.
      </p>

      {/* Mobile: horizontal rolling; md+: grid */}
      <div
        className="no-scrollbar relative left-1/2 right-1/2 -mx-[50vw] mt-8 w-screen max-w-[100vw] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-4 scroll-pr-4 px-0 pb-2 md:static md:mx-0 md:mt-10 md:w-auto md:max-w-none md:snap-none md:overflow-visible md:pb-0"
        role="region"
        aria-label="Poin optimasi — geser horizontal di mobile"
      >
        <div className="flex w-max items-stretch gap-3 px-4 md:grid md:w-full md:max-w-none md:px-0 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {points.map((p) => {
            const Icon = p.icon;
            return (
              <article
                key={p.title}
                className={[
                  "w-[min(19rem,calc(100vw-2rem))] shrink-0 snap-start snap-always rounded-2xl border border-border/70 bg-card px-5 py-5 shadow-sm md:w-auto md:snap-none",
                  p.wideOnDesktop ? "md:col-span-2 lg:col-span-2" : "",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-orange/10 text-accent-orange">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-sm font-bold text-navy">{p.title}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
