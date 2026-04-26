import { lazy, Suspense, useEffect, useState } from "react";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { Header } from "@/share/Header";
import {
  PackageConsultOpenerProvider,
  usePackageConsultOpenerOptional,
} from "@/1-home/context/PackageConsultOpenerContext";
import { DeferUntilNearViewport } from "@/share/DeferUntilNearViewport";
import { cn } from "@/share/lib/utils";
import { WEDDING_HERO_IMAGE_SRC, WEDDING_HERO_IMAGE_SRCSET } from "@/1-home/assets/hero/weddingHeroImage";
import { MobileHomeStickyFooter } from "@/1-home/components/MobileHomeStickyFooter";
import { WeddingHeroSection } from "@/1-home/sections/WeddingHeroSection";
import type { WeddingPaketKind } from "@/1-home/sections/WeddingPackagesSection";

const Footer = lazy(() => import("@/share/Footer").then((m) => ({ default: m.Footer })));
const WeddingPackagesSection = lazy(() =>
  import("@/1-home/sections/WeddingPackagesSection").then((m) => ({ default: m.WeddingPackagesSection })),
);
const WeddingGuaranteeSplitSection = lazy(() =>
  import("@/1-home/sections/WeddingGuaranteeSplitSection").then((m) => ({
    default: m.WeddingGuaranteeSplitSection,
  })),
);
const WeddingGaransiMobileSection = lazy(() =>
  import("@/1-home/sections/WeddingGaransiMobileSection").then((m) => ({
    default: m.WeddingGaransiMobileSection,
  })),
);
const WeddingCtaSection = lazy(() =>
  import("@/1-home/sections/WeddingCtaSection").then((m) => ({ default: m.WeddingCtaSection })),
);
const WeddingFaqSection = lazy(() =>
  import("@/1-home/sections/WeddingFaqSection").then((m) => ({ default: m.WeddingFaqSection })),
);

function LazySectionFallback({ className }: { className: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-muted/35 motion-reduce:animate-none", className)}
      aria-hidden
    />
  );
}

export function HomePage() {
  return (
    <PackageConsultOpenerProvider>
      <HomePageInner />
    </PackageConsultOpenerProvider>
  );
}

function HomePageInner() {
  const packageConsultOpener = usePackageConsultOpenerOptional();
  const [blockLandscapeTouch, setBlockLandscapeTouch] = useState(false);
  const [weddingPaketKind, setWeddingPaketKind] = useState<WeddingPaketKind>("dokumentasi");

  const weddingDokumentasiLeadCard = {
    title: "Kualitas “papan atas”, harga lebih masuk akal",
    body: "Banyak vendor premium mematok harga tinggi. Vialdi Wedding bantu Anda dapat hasil yang setara—dengan garansi yang jelas dan harga lebih terjangkau.",
  };

  useEffect(() => {
    let cancelled = false;
    const tryLockPortrait = () => {
      if (cancelled) return;
      const so = screen.orientation as unknown as { lock?: (o: "portrait") => Promise<void> };
      if (so && typeof so.lock === "function") {
        void so.lock("portrait").catch(() => {});
      }
    };

    let onFirstPointer: (() => void) | null = null;
    const armListeners = () => {
      if (cancelled) return;
      tryLockPortrait();
      onFirstPointer = () => {
        tryLockPortrait();
        if (onFirstPointer) window.removeEventListener("pointerdown", onFirstPointer);
      };
      window.addEventListener("pointerdown", onFirstPointer, { passive: true });
    };

    let idleId = 0;
    let usedIdleCallback = false;
    if (typeof requestIdleCallback !== "undefined") {
      usedIdleCallback = true;
      idleId = requestIdleCallback(armListeners, { timeout: 2500 });
    } else {
      idleId = window.setTimeout(armListeners, 0);
    }

    return () => {
      cancelled = true;
      if (usedIdleCallback && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
      if (onFirstPointer) window.removeEventListener("pointerdown", onFirstPointer);
      try {
        screen.orientation?.unlock?.();
      } catch {
        /* beberapa browser tidak mengizinkan unlock di konteks ini */
      }
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (pointer: coarse)");
    const sync = () => setBlockLandscapeTouch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <div className="min-h-screen touch-manipulation bg-background pb-[calc(52px+env(safe-area-inset-bottom))] md:pb-0">
      {blockLandscapeTouch ? (
        <div
          role="alertdialog"
          aria-live="polite"
          aria-label="Mode portrait diperlukan"
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4 bg-background/97 px-6 text-center backdrop-blur-sm"
        >
          <p className="max-w-sm text-base font-semibold text-foreground">
            Silakan putar perangkat kembali ke posisi portrait.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Halaman beranda dioptimalkan untuk tampilan tegak; landscape dinonaktifkan di perangkat
            sentuh.
          </p>
        </div>
      ) : null}

      <Header />

      <WeddingHeroSection
        heroImageSrc={WEDDING_HERO_IMAGE_SRC}
        heroImageSrcSet={WEDDING_HERO_IMAGE_SRCSET}
        onCtaClick={(e) => {
          if (packageConsultOpener) {
            e.preventDefault();
            packageConsultOpener.requestOpenAllPackageConsults();
          }
        }}
      />

      <div className="flex flex-col">
        <Suspense fallback={<LazySectionFallback className="min-h-[28rem]" />}>
          <WeddingPackagesSection
            kind={weddingPaketKind}
            onChangeKind={(k) => setWeddingPaketKind(k)}
            dokumentasiLeadCard={weddingDokumentasiLeadCard}
          />
        </Suspense>
        <Suspense fallback={<LazySectionFallback className="min-h-[18rem]" />}>
          <WeddingGuaranteeSplitSection />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <WeddingGaransiMobileSection
          onCtaClick={(e) => {
            if (packageConsultOpener) {
              e.preventDefault();
              packageConsultOpener.requestOpenAllPackageConsults();
            }
          }}
        />
      </Suspense>
      <Suspense fallback={<LazySectionFallback className="min-h-[16rem]" />}>
        <WeddingCtaSection
          onCtaClick={(e) => {
            if (packageConsultOpener) {
              e.preventDefault();
              packageConsultOpener.requestOpenAllPackageConsults();
            }
          }}
        />
      </Suspense>
      <Suspense fallback={<LazySectionFallback className="min-h-[22rem]" />}>
        <WeddingFaqSection />
      </Suspense>

      <DeferUntilNearViewport rootMargin="0px 0px 480px 0px" placeholderClassName="min-h-[14rem]">
        <Suspense fallback={<LazySectionFallback className="min-h-[14rem]" />}>
          <Footer />
        </Suspense>
      </DeferUntilNearViewport>

      <MobileHomeStickyFooter
        instagramId="home-instagram"
        hargaPaketId="paket-dokumentasi"
        garansiId="home-garansi"
        faqId="home-faq"
      />
    </div>
  );
}
