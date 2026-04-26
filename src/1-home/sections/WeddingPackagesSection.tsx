import { lazy, Suspense } from "react";
import { SectionTitle } from "@/1-home/components/SectionTitle";
import { DeferUntilNearViewport } from "@/share/DeferUntilNearViewport";
import { cn } from "@/share/lib/utils";

const InstagramProfileEmbed = lazy(() =>
  import("@/1-home/sections/InstagramProfileEmbed").then((m) => ({ default: m.InstagramProfileEmbed })),
);
const BeforeAfterShowcase = lazy(() =>
  import("@/1-home/sections/BeforeAfterShowcase").then((m) => ({ default: m.BeforeAfterShowcase })),
);
const WeddingPackageHighlight = lazy(() =>
  import("@/1-home/packages/WeddingPackageHighlight").then((m) => ({ default: m.WeddingPackageHighlight })),
);
const PostPackageTrustLeadCard = lazy(() =>
  import("@/1-home/sections/PostPackageTrustSection").then((m) => ({ default: m.PostPackageTrustLeadCard })),
);
const PostPackageTrustSection = lazy(() =>
  import("@/1-home/sections/PostPackageTrustSection").then((m) => ({ default: m.PostPackageTrustSection })),
);

function LazySectionFallback({ className }: { className: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted/35 motion-reduce:animate-none", className)} aria-hidden />
  );
}

export type WeddingPaketKind = "dokumentasi" | "rias-gaun" | "dekorasi" | "all-in-one" | "all";

export function WeddingPackagesSection({
  kind,
  onChangeKind,
  dokumentasiLeadCard,
}: {
  kind: WeddingPaketKind;
  onChangeKind: (k: Exclude<WeddingPaketKind, "all">) => void;
  dokumentasiLeadCard: { title: string; body: string };
}) {
  return (
    <section
      id="paket-dokumentasi"
      className="order-1 scroll-mt-24 border-t border-border/60 bg-secondary/30 pt-8 pb-8 md:pt-10 md:pb-10"
    >
      <div className="mx-auto max-w-[90rem] px-4 pb-5 md:px-6 md:pb-6">
        <SectionTitle
          className="text-left"
          align="left"
          title="Paket unggulan"
          subtitle={
            kind === "dokumentasi"
              ? "Momen sekali seumur hidup — jangan ambil risiko. Dapatkan foto & video yang rapi, terarah, dan sesuai gaya Anda."
              : kind === "rias-gaun"
                ? "Tampil percaya diri dari first look sampai resepsi. Rias tahan lama + pilihan gaun/jas yang fit dan nyaman—tanpa drama."
                : kind === "dekorasi"
                  ? "Dekor rapi, elegan, dan fotogenik. Kami bantu wujudkan konsep yang Anda mau, disesuaikan venue & budget."
                  : kind === "all-in-one"
                    ? "Paket paling praktis: sekali booking, semua beres. Tim kami sinkronkan rundown, look, dekor, dan dokumentasi biar Anda tinggal menikmati hari H."
                    : "Pilih kategori paket sesuai kebutuhan — detail final mengikuti tanggal, lokasi, dan add-on yang Anda pilih."
          }
          belowTitle={
            <nav aria-label="Kategori paket wedding" className="mt-4 w-full min-w-0">
              <div className="no-scrollbar relative left-1/2 right-1/2 -mx-[50vw] w-screen max-w-[100vw] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-4 scroll-pr-4 px-0 md:static md:mx-0 md:w-full md:max-w-full md:snap-none md:scroll-p-0 md:overflow-visible">
                <ul className="flex w-max flex-nowrap items-stretch justify-start gap-2 px-4 md:w-full md:flex-wrap md:gap-2.5 md:px-0">
                  {(
                    [
                      { id: "dokumentasi", label: "Dokumentasi" },
                      { id: "rias-gaun", label: "Rias & Gaun" },
                      { id: "dekorasi", label: "Dekorasi" },
                      { id: "all-in-one", label: "Paket All in one" },
                    ] as const
                  ).map((p) => (
                    <li key={p.id} className="shrink-0 snap-start">
                      <button
                        type="button"
                        onClick={() => onChangeKind(p.id)}
                        className={
                          kind === p.id
                            ? "inline-flex shrink-0 rounded-full border border-[oklch(0.48_0.2_300)] bg-[oklch(0.48_0.2_300)]/10 px-3 py-2 text-xs font-semibold text-[oklch(0.48_0.2_300)] shadow-sm ring-2 ring-[oklch(0.48_0.2_300)]/20 md:px-3.5 md:text-sm"
                            : "inline-flex shrink-0 rounded-full border border-border/70 bg-card/90 px-3 py-2 text-xs font-semibold text-navy shadow-sm transition-[color,background-color,border-color,opacity] hover:border-[oklch(0.48_0.2_300)]/40 hover:text-[oklch(0.48_0.2_300)] md:px-3.5 md:text-sm"
                        }
                        aria-current={kind === p.id ? "page" : undefined}
                      >
                        {p.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          }
        />
      </div>

      <DeferUntilNearViewport className="w-full" placeholderClassName="min-h-[300px] pb-3 md:min-h-[56rem] md:pb-4">
        <Suspense
          fallback={<LazySectionFallback className="min-h-[300px] w-full pb-3 md:min-h-[56rem] md:pb-4" />}
        >
          <WeddingPackageHighlight kind={kind} />
        </Suspense>
      </DeferUntilNearViewport>

      {/* Mobile: Instagram + Quote + Risiko + Alasan selalu tampil di semua tab wedding */}
      <div className="mx-auto max-w-[90rem] px-4 pt-6 pb-0 md:hidden">
        {kind === "dokumentasi" ? (
          <DeferUntilNearViewport placeholderClassName="min-h-[14rem]">
            <Suspense fallback={<LazySectionFallback className="min-h-[14rem]" />}>
              <PostPackageTrustLeadCard title={dokumentasiLeadCard.title} body={dokumentasiLeadCard.body} />
            </Suspense>
          </DeferUntilNearViewport>
        ) : null}
      </div>

      <div id="home-instagram" className="mx-auto max-w-[90rem] scroll-mt-24 px-2.5 pt-6 pb-0 md:hidden">
        <DeferUntilNearViewport placeholderClassName="min-h-[28rem]">
          <Suspense fallback={<LazySectionFallback className="min-h-[28rem]" />}>
            <InstagramProfileEmbed variant="compact" contained={false} />
          </Suspense>
        </DeferUntilNearViewport>
      </div>

      {kind === "dokumentasi" ? (
        <div className="mx-auto max-w-[90rem] px-2.5 pt-6 pb-0 md:hidden">
          <DeferUntilNearViewport placeholderClassName="min-h-[28rem]">
            <Suspense fallback={<LazySectionFallback className="min-h-[28rem]" />}>
              <BeforeAfterShowcase />
            </Suspense>
          </DeferUntilNearViewport>
        </div>
      ) : null}

      <div className="mx-auto mt-6 max-w-[90rem] px-2.5 pb-0 md:hidden">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/80 px-4 py-5 text-center shadow-sm">
          <p className="font-wedding-serif text-base italic leading-relaxed text-muted-foreground">
            &ldquo;Bayangkan persiapan hari H terasa ringan: rundown rapi, koordinasi jelas, dan tim yang paham ritme
            acara—jadi Anda tinggal fokus menikmati momen.&rdquo;
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[90rem] px-2.5 pt-6 pb-0 md:hidden">
        <DeferUntilNearViewport placeholderClassName="min-h-[22rem]">
          <Suspense fallback={<LazySectionFallback className="min-h-[22rem]" />}>
            <PostPackageTrustSection variant="risksOnly" showInstagram={false} showQuote={false} />
          </Suspense>
        </DeferUntilNearViewport>
      </div>

      <div className="md:hidden">
        <div className="relative left-1/2 right-1/2 -mx-[50vw] mt-6 w-screen max-w-[100vw] px-0">
          <div className="mx-auto max-w-[90rem] px-2.5">
            <DeferUntilNearViewport placeholderClassName="min-h-[10rem]">
              <Suspense fallback={<LazySectionFallback className="min-h-[10rem]" />}>
                <PostPackageTrustSection variant="reasonsOnly" showInstagram={false} showQuote={false} />
              </Suspense>
            </DeferUntilNearViewport>
          </div>
        </div>
      </div>

      {/* Desktop blocks */}
      <div className="mx-auto hidden max-w-[90rem] border-t border-border/50 px-4 pt-8 md:mt-10 md:block md:px-6 md:pt-10">
        {kind === "dokumentasi" ? (
          <DeferUntilNearViewport placeholderClassName="min-h-[14rem]">
            <Suspense fallback={<LazySectionFallback className="min-h-[14rem]" />}>
              <PostPackageTrustLeadCard title={dokumentasiLeadCard.title} body={dokumentasiLeadCard.body} />
            </Suspense>
          </DeferUntilNearViewport>
        ) : null}

        <div className="pt-10">
          <DeferUntilNearViewport placeholderClassName="min-h-[28rem]">
            <Suspense fallback={<LazySectionFallback className="min-h-[28rem]" />}>
              <InstagramProfileEmbed variant="compact" contained={false} />
            </Suspense>
          </DeferUntilNearViewport>
        </div>

        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card/80 px-4 py-5 text-center shadow-sm md:mt-8 md:px-6 md:py-6">
          <p className="font-wedding-serif text-base italic leading-relaxed text-muted-foreground md:text-lg">
            &ldquo;Bayangkan persiapan hari H terasa ringan: rundown rapi, koordinasi jelas, dan tim yang paham ritme
            acara—jadi Anda tinggal fokus menikmati momen.&rdquo;
          </p>
        </div>

        <div className="mt-10">
          <DeferUntilNearViewport placeholderClassName="min-h-[12rem]">
            <Suspense fallback={<LazySectionFallback className="min-h-[12rem]" />}>
              <PostPackageTrustSection showInstagram={false} showQuote={false} />
            </Suspense>
          </DeferUntilNearViewport>
        </div>
      </div>
    </section>
  );
}

