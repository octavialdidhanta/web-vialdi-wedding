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

const NUDGE_PX = 14;
const NUDGE_BACK_MS = 400;
/** Setelah geser melewati ini, anggap pengguna sudah tahu ada kartu lain — hentikan petunjuk otomatis. */
const USER_EXPLORED_SCROLL_LEFT = 40;
const HINT_INTERVAL_MS = 15000;
const FIRST_HINT_DELAY_MS = 900;

/** Kartu paket (scroll horizontal) — termasuk promo Junior & Akad Nikah. */
export function WeddingPackageHighlight() {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollEl = carouselRef.current;
    if (!scrollEl) return;

    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mqMobile.matches || mqReduce.matches) return;

    let intervalId = 0;
    let cancelled = false;
    let userHasExplored = false;

    function clearHintTimer() {
      if (intervalId) window.clearInterval(intervalId);
      intervalId = 0;
    }

    function nudgePeek() {
      const el = carouselRef.current;
      if (!el || cancelled || userHasExplored) return;
      if (el.scrollLeft > USER_EXPLORED_SCROLL_LEFT - 8) return;
      if (el.scrollWidth <= el.clientWidth + 4) return;

      el.scrollBy({ left: NUDGE_PX, behavior: "smooth" });
      window.setTimeout(() => {
        const inner = carouselRef.current;
        if (!inner || cancelled || userHasExplored) return;
        inner.scrollBy({ left: -NUDGE_PX, behavior: "smooth" });
      }, NUDGE_BACK_MS);
    }

    function onScroll() {
      const el = carouselRef.current;
      if (!el) return;
      if (el.scrollLeft > USER_EXPLORED_SCROLL_LEFT) {
        userHasExplored = true;
        clearHintTimer();
      }
    }

    scrollEl.addEventListener("scroll", onScroll, { passive: true });

    const firstT = window.setTimeout(() => {
      if (!cancelled) nudgePeek();
    }, FIRST_HINT_DELAY_MS);

    intervalId = window.setInterval(() => {
      if (!cancelled) nudgePeek();
    }, HINT_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(firstT);
      clearHintTimer();
      scrollEl.removeEventListener("scroll", onScroll);
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
        <div className="flex w-max flex-nowrap items-stretch gap-2 px-2 sm:gap-3 md:gap-4 md:px-0">
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
