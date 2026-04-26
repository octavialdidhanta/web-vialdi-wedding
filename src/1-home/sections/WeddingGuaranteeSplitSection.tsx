import { lazy, Suspense } from "react";
import { DeferUntilNearViewport } from "@/share/DeferUntilNearViewport";
import { cn } from "@/share/lib/utils";

const JanjiCompanionColumn = lazy(() =>
  import("@/1-home/components/JanjiCompanionColumn").then((m) => ({ default: m.JanjiCompanionColumn })),
);
const WeddingGuaranteeSection = lazy(() =>
  import("@/1-home/sections/WeddingGuaranteeSection").then((m) => ({ default: m.WeddingGuaranteeSection })),
);

function LazySectionFallback({ className }: { className: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted/35 motion-reduce:animate-none", className)} aria-hidden />
  );
}

export function WeddingGuaranteeSplitSection() {
  return (
    <section className="order-2 bg-secondary/40 pt-12 pb-10 md:pt-16 md:pb-14">
      <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-14 px-2.5 md:px-6 md:gap-16 lg:grid-cols-2 lg:items-start lg:gap-x-32 lg:gap-y-0 xl:gap-x-40 2xl:gap-x-48">
        <DeferUntilNearViewport placeholderClassName="min-h-[28rem] md:min-h-[32rem]">
          <Suspense fallback={<LazySectionFallback className="min-h-[28rem] md:min-h-[32rem]" />}>
            <WeddingGuaranteeSection />
          </Suspense>
        </DeferUntilNearViewport>
        <div className="hidden md:block">
          <DeferUntilNearViewport placeholderClassName="min-h-[36rem]">
            <Suspense fallback={<LazySectionFallback className="min-h-[36rem]" />}>
              <JanjiCompanionColumn />
            </Suspense>
          </DeferUntilNearViewport>
        </div>
      </div>
    </section>
  );
}

