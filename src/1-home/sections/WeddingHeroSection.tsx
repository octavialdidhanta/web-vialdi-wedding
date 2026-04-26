import { lazy, Suspense } from "react";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { DeferUntilNearViewport } from "@/share/DeferUntilNearViewport";
import { cn } from "@/share/lib/utils";

const HeroAlbumKolaseVideo = lazy(() =>
  import("@/1-home/sections/HeroAlbumKolaseVideo").then((m) => ({ default: m.HeroAlbumKolaseVideo })),
);

function LazySectionFallback({ className }: { className: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted/35 motion-reduce:animate-none", className)} aria-hidden />
  );
}

export function WeddingHeroSection({
  heroImageSrc,
  onCtaClick,
}: {
  heroImageSrc: string;
  onCtaClick: (ev: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <section className="relative overflow-x-hidden border-b border-border/40 bg-background pb-10 md:pb-14 lg:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{
          background: "linear-gradient(135deg, oklch(0.88 0.05 300), oklch(0.94 0.02 95))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[oklch(0.75_0.08_300)]/15 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-[90rem] items-center gap-12 px-2.5 pt-10 pb-10 md:px-6 md:pt-16 md:pb-12 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-navy shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[oklch(0.55_0.16_300)]" />
            Wedding organizer &amp; dokumentasi
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight text-navy md:text-5xl lg:text-[3.35rem]">
            Wujudkan pernikahan impian dengan{" "}
            <span className="bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] bg-clip-text text-transparent">
              dekorasi, busana, rias
            </span>
            , dan tim foto-video profesional.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Vialdi Wedding mendampingi Anda dari konsep, persiapan, hingga kenangan yang rapi di album dan layar —
            supaya hari H terasa ringan, indah, dan berkesan.
          </p>
          <div className="mt-8">
            <a
              href="#paket-dokumentasi"
              data-track={TRACK_KEYS.contactCta}
              className="inline-flex rounded-full bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-elegant)] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.48_0.2_300)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={onCtaClick}
            >
              Konsultasi gratis
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
            <img
              src={heroImageSrc}
              alt="Pasangan pengantin dalam suasana pernikahan elegan"
              width={720}
              height={720}
              sizes="(max-width: 767px) calc(100vw - 1.25rem), (max-width: 1023px) calc(100vw - 3rem), min(560px, 46vw)"
              fetchPriority="high"
              decoding="async"
              className="aspect-square w-full object-cover object-bottom"
            />
            <p className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/45 px-2 py-1 text-[0.65rem] font-medium leading-none tracking-wide text-white/95 backdrop-blur-[2px] sm:bottom-3 sm:right-3 sm:text-[0.7rem]">
              Photo by Vialdi Wedding
            </p>
          </div>
          <div className="absolute -left-4 top-8 hidden rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm md:block">
            <p className="max-w-[11rem] text-xs font-medium leading-snug text-navy">
              Paket foto &amp; video + album — ringkas dalam satu penawaran.
            </p>
          </div>
          <div className="absolute -right-4 bottom-8 hidden rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm md:block">
            <p className="max-w-[10rem] text-xs text-muted-foreground">Tim berpengalaman untuk hotel &amp; gedung.</p>
          </div>
        </div>
      </div>

      <DeferUntilNearViewport rootMargin="240px 0px 240px 0px" placeholderClassName="min-h-[22rem] md:min-h-[28rem]">
        <Suspense fallback={<LazySectionFallback className="min-h-[22rem] md:min-h-[28rem]" />}>
          <HeroAlbumKolaseVideo />
        </Suspense>
      </DeferUntilNearViewport>
    </section>
  );
}

