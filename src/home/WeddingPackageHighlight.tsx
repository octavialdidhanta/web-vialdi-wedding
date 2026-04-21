import { useEffect, useRef } from "react";
import { AkadNikahSpesialPromoCard } from "@/home/AkadNikahSpesialPromoCard";
import { RoyalWeddingPackageCard } from "@/home/RoyalWeddingPackageCard";
import { RoyalWeddingPlatinumFotoOnlyCard } from "@/home/RoyalWeddingPlatinumFotoOnlyCard";
import { WeddingGoldPremiumCard } from "@/home/WeddingGoldPremiumCard";
import { WeddingPlatinumAlbumCard } from "@/home/WeddingPlatinumAlbumCard";
import { WeddingJuniorPackageCard } from "@/home/WeddingJuniorPackageCard";
import { WeddingSuperJuniorPackageCard } from "@/home/WeddingSuperJuniorPackageCard";

/** Mobile: kartu sedikit lebih sempit agar terlihat “cuil” kartu berikutnya (peek) tanpa chevron. Desktop: tinggi kartu seragam. */
const cardShell =
  "min-w-[19rem] w-[min(25rem,calc(100vw-2rem))] max-w-[28rem] shrink-0 snap-start snap-always self-stretch md:flex md:h-[56rem] md:max-h-[56rem] md:min-h-0 md:min-w-[21rem] md:w-[min(28rem,calc(100vw-3rem))] md:flex-col";

/** Petunjuk pantul berulang selama tidak ada sentuhan di area carousel. */
const BOUNCE_TICK_MS = 3000;
/** Pantulan pertama sedikit lebih cepat setelah layout. */
const FIRST_BOUNCE_MS = 900;
/** Hanya di posisi kartu paling kiri: scroll dianggap masih “kartu pertama”. */
const AT_FIRST_CARD_MAX_SCROLL_PX = 20;
/** Lewati ini sekali = pengguna sudah tahu carousel horizontal → hentikan pantul selamanya (sampai reload). */
const USER_DISCOVERED_HORIZONTAL_SCROLL_PX = 36;

/** Kartu paket (scroll horizontal) — termasuk promo Junior & Akad Nikah. */
export function WeddingPackageHighlight() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollEl = carouselRef.current;
    const trackEl = trackRef.current;
    if (!scrollEl || !trackEl) return;

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqReduce.matches) return;

    let cancelled = false;
    let intervalId = 0;
    let firstTimeoutId = 0;
    let animPlaying = false;
    let userDiscoveredHorizontalScroll = false;
    /** Identifier sentuhan yang *dimulai* di dalam carousel (tetap dihitung walau jari keluar area). */
    const touchIdsStartedOnCarousel = new Set<number>();

    function stripBounce() {
      trackEl.classList.remove("pkg-carousel-bounce-hint");
      animPlaying = false;
    }

    function touchTargetInCarousel(t: Touch): boolean {
      const n = t.target;
      return n instanceof Node && scrollEl.contains(n);
    }

    function stopBounceTimers() {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = 0;
      }
      if (firstTimeoutId) {
        window.clearTimeout(firstTimeoutId);
        firstTimeoutId = 0;
      }
    }

    function onCarouselScroll() {
      const outer = carouselRef.current;
      if (!outer || cancelled) return;
      if (outer.scrollLeft > USER_DISCOVERED_HORIZONTAL_SCROLL_PX) {
        userDiscoveredHorizontalScroll = true;
        stripBounce();
        stopBounceTimers();
      }
    }

    function tryPlayBounceHint() {
      if (cancelled) return;
      if (userDiscoveredHorizontalScroll) return;
      if (touchIdsStartedOnCarousel.size > 0 || document.visibilityState !== "visible") return;
      if (animPlaying) return;

      const outer = carouselRef.current;
      const inner = trackRef.current;
      if (!outer || !inner) return;
      if (outer.scrollWidth <= outer.clientWidth + 4) return;
      if (outer.scrollLeft > AT_FIRST_CARD_MAX_SCROLL_PX) return;

      animPlaying = true;
      inner.classList.add("pkg-carousel-bounce-hint");
      const onEnd = () => {
        inner.classList.remove("pkg-carousel-bounce-hint");
        inner.removeEventListener("animationend", onEnd);
        animPlaying = false;
      };
      inner.addEventListener("animationend", onEnd, { once: true });
    }

    function onDocumentTouchStart(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        if (touchTargetInCarousel(t)) {
          touchIdsStartedOnCarousel.add(t.identifier);
          stripBounce();
        }
      }
    }

    function onDocumentTouchEndOrCancel(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        touchIdsStartedOnCarousel.delete(t.identifier);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState !== "visible") {
        stripBounce();
      }
    }

    document.addEventListener("touchstart", onDocumentTouchStart, { capture: true, passive: true });
    document.addEventListener("touchend", onDocumentTouchEndOrCancel, { capture: true, passive: true });
    document.addEventListener("touchcancel", onDocumentTouchEndOrCancel, { capture: true, passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    scrollEl.addEventListener("scroll", onCarouselScroll, { passive: true });

    onCarouselScroll();

    if (!userDiscoveredHorizontalScroll) {
      firstTimeoutId = window.setTimeout(() => {
        if (!cancelled) tryPlayBounceHint();
      }, FIRST_BOUNCE_MS);

      intervalId = window.setInterval(() => {
        if (!cancelled) tryPlayBounceHint();
      }, BOUNCE_TICK_MS);
    }

    return () => {
      cancelled = true;
      stopBounceTimers();
      stripBounce();
      scrollEl.removeEventListener("scroll", onCarouselScroll);
      document.removeEventListener("touchstart", onDocumentTouchStart, true);
      document.removeEventListener("touchend", onDocumentTouchEndOrCancel, true);
      document.removeEventListener("touchcancel", onDocumentTouchEndOrCancel, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Mobile: full bleed horizontal strip; md+: lebar konten normal */}
      <div
        ref={carouselRef}
        data-package-carousel=""
        className="no-scrollbar relative left-1/2 right-1/2 -mx-[50vw] w-screen max-w-[100vw] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth scroll-pl-2 scroll-pr-2 px-0 pb-3 sm:pb-3 md:static md:mx-auto md:w-full md:max-w-[90rem] md:overflow-x-auto md:snap-x md:scroll-pl-6 md:scroll-pr-6 md:px-6 md:pb-4"
        role="region"
        aria-label="Daftar paket foto dan video — geser horizontal untuk melihat paket lainnya"
      >
        <div
          ref={trackRef}
          className="flex w-max flex-nowrap items-stretch gap-2 px-2 sm:gap-3 md:gap-4 md:px-0"
        >
          <div className={cardShell}>
            <RoyalWeddingPackageCard />
          </div>
          <div className={cardShell}>
            <WeddingGoldPremiumCard />
          </div>
          <div className={cardShell}>
            <WeddingSuperJuniorPackageCard />
          </div>
          <div className={cardShell}>
            <RoyalWeddingPlatinumFotoOnlyCard />
          </div>
          <div className={cardShell}>
            <WeddingPlatinumAlbumCard />
          </div>
          <div className={cardShell}>
            <WeddingJuniorPackageCard />
          </div>
          <div className={cardShell}>
            <AkadNikahSpesialPromoCard />
          </div>
        </div>
      </div>

      <p className="mt-1 px-2 text-left text-[0.7rem] leading-snug text-muted-foreground md:px-6 lg:hidden">
        Geser ke samping untuk melihat paket lainnya.
      </p>
    </div>
  );
}
