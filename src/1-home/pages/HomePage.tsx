import { lazy, Suspense, useEffect, useState } from "react";
import { TRACK_KEYS } from "@/analytics/trackRegistry";
import { Header } from "@/share/Header";
import {
  PackageConsultOpenerProvider,
  usePackageConsultOpenerOptional,
} from "@/1-home/context/PackageConsultOpenerContext";
import { DeferUntilNearViewport } from "@/share/DeferUntilNearViewport";
import { cn } from "@/share/lib/utils";
import weddingHeroImage from "@/1-home/assets/hero/DSC00768_11zon.webp";
import { MobileHomeStickyFooter } from "@/1-home/components/MobileHomeStickyFooter";
import { WeddingHeroSection } from "@/1-home/sections/WeddingHeroSection";
import { WeddingPackagesSection } from "@/1-home/sections/WeddingPackagesSection";
import type { WeddingPaketKind } from "@/1-home/sections/WeddingPackagesSection";
import { WeddingGuaranteeSplitSection } from "@/1-home/sections/WeddingGuaranteeSplitSection";
import { WeddingGaransiMobileSection } from "@/1-home/sections/WeddingGaransiMobileSection";
import { WeddingCtaSection } from "@/1-home/sections/WeddingCtaSection";
import { WeddingFaqSection } from "@/1-home/sections/WeddingFaqSection";

const Footer = lazy(() => import("@/share/Footer").then((m) => ({ default: m.Footer })));

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
    tryLockPortrait();
    const onFirstPointer = () => {
      tryLockPortrait();
      window.removeEventListener("pointerdown", onFirstPointer);
    };
    window.addEventListener("pointerdown", onFirstPointer, { passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onFirstPointer);
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
        heroImageSrc={weddingHeroImage}
        onCtaClick={(e) => {
          if (packageConsultOpener) {
            e.preventDefault();
            packageConsultOpener.requestOpenAllPackageConsults();
          }
        }}
      />

      <div className="flex flex-col">
        <WeddingPackagesSection
          kind={weddingPaketKind}
          onChangeKind={(k) => setWeddingPaketKind(k)}
          dokumentasiLeadCard={weddingDokumentasiLeadCard}
        />
        <WeddingGuaranteeSplitSection />
      </div>

      <WeddingGaransiMobileSection
        onCtaClick={(e) => {
          if (packageConsultOpener) {
            e.preventDefault();
            packageConsultOpener.requestOpenAllPackageConsults();
          }
        }}
      />
      <WeddingCtaSection
        onCtaClick={(e) => {
          if (packageConsultOpener) {
            e.preventDefault();
            packageConsultOpener.requestOpenAllPackageConsults();
          }
        }}
      />
      <WeddingFaqSection />

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
