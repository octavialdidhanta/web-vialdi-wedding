import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { normalizeCarouselPackageIds } from "@/blog/weddingPackageIds";
import {
  fetchPublishedPackages,
  fetchPublishedPackagesByIds,
  type WeddingPackageRow,
} from "@/blog/weddingPackages";
import { DynamicWeddingPackageCardEmbed } from "@/1-home/packages/DynamicWeddingPackageCardEmbed";

const DynamicWeddingPackageCard = lazy(() =>
  import("@/1-home/packages/DynamicWeddingPackageCard").then((m) => ({ default: m.DynamicWeddingPackageCard })),
);

/** Mobile: kartu sedikit lebih sempit agar terlihat “cuil” kartu berikutnya (peek) tanpa chevron. Desktop: tinggi kartu seragam. */
export const packageCarouselCardShell =
  "min-w-[19rem] w-[min(25rem,calc(100vw-2rem))] max-w-[28rem] shrink-0 snap-start snap-always self-stretch md:flex md:h-[56rem] md:max-h-[56rem] md:min-h-0 md:min-w-[21rem] md:w-[min(28rem,calc(100vw-3rem))] md:flex-col";

const BOUNCE_TICK_MS = 3000;
const FIRST_BOUNCE_MS = 900;
const AT_FIRST_CARD_MAX_SCROLL_PX = 20;
const USER_DISCOVERED_HORIZONTAL_SCROLL_PX = 36;

type Props = {
  /** Beranda: semua paket terbit. Embed: subset by id (UUID atau slug legacy). */
  mode?: "home" | "pick";
  /** Filter kategori untuk mode `home` (wedding). */
  kind?: "dokumentasi" | "rias-gaun" | "dekorasi" | "all-in-one" | "all";
  /** Untuk mode `pick`: urutan id (UUID / slug lama). */
  packageIds?: readonly string[];
  /** Jika sudah di-fetch di parent (urutan = urutan kartu). */
  packages?: WeddingPackageRow[];
  showSwipeHint?: boolean;
};

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function shouldIncludeWeddingPackage(pkg: WeddingPackageRow, kind: Props["kind"]): boolean {
  if (!kind || kind === "all") return true;
  const hay = normalizeText(`${pkg.package_label} ${pkg.title} ${pkg.badge_label}`);

  const has = (re: RegExp) => re.test(hay);

  const dokumentasi = /\b(dokumentasi|foto|video|album)\b/i;
  const riasGaun = /\b(rias|makeup|mu?a|gaun|jas|busana|dress)\b/i;
  const dekorasi = /\b(dekorasi|dekor|pelaminan)\b/i;
  const allInOne = /\b(all[- ]?in[- ]?one|paket lengkap|all[- ]?in)\b/i;

  if (kind === "all-in-one") {
    const hits =
      Number(has(dokumentasi)) + Number(has(riasGaun)) + Number(has(dekorasi)) + Number(has(allInOne));
    return has(allInOne) || hits >= 2;
  }
  if (kind === "dokumentasi") return has(dokumentasi);
  if (kind === "rias-gaun") return has(riasGaun);
  if (kind === "dekorasi") return has(dekorasi);
  return true;
}

/**
 * Strip carousel paket — full bleed + snap di mobile, sama seperti blok paket beranda.
 */
export function PackageCarouselStrip({
  mode = "pick",
  kind = "all",
  packageIds = [],
  packages: preloaded,
  showSwipeHint = true,
}: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const normalizedIds = useMemo(
    () => (mode === "home" ? [] : normalizeCarouselPackageIds(packageIds)),
    [mode, packageIds],
  );

  const preloadedKey = preloaded ? preloaded.map((p) => p.id).join(",") : "";

  const query = useQuery({
    queryKey: ["wedding-packages-carousel", mode, normalizedIds.join(","), preloadedKey],
    queryFn: async () => {
      if (preloaded?.length) {
        return preloaded;
      }
      if (mode === "home") {
        return fetchPublishedPackages();
      }
      return fetchPublishedPackagesByIds(normalizedIds);
    },
    enabled: Boolean(preloaded?.length || mode === "home" || normalizedIds.length > 0),
  });

  const rows = useMemo(() => {
    const data = preloaded ?? query.data ?? [];
    if (mode === "home") {
      return data.filter((p) => shouldIncludeWeddingPackage(p, kind));
    }
    const byId = new Map(data.map((p) => [p.id, p]));
    return normalizedIds.map((id) => byId.get(id)).filter((x): x is WeddingPackageRow => Boolean(x));
  }, [kind, mode, normalizedIds, preloaded, query.data]);

  const orderedIdsKey = rows.map((r) => r.id).join(",");

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

      requestAnimationFrame(() => {
        if (cancelled) return;
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
      });
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
    document.addEventListener("touchend", onDocumentTouchEndOrCancel, {
      capture: true,
      passive: true,
    });
    document.addEventListener("touchcancel", onDocumentTouchEndOrCancel, {
      capture: true,
      passive: true,
    });
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
  }, [orderedIdsKey]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
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
          {rows.map((pkg) => (
            <div key={pkg.id} className={packageCarouselCardShell}>
              {mode === "pick" ? (
                <DynamicWeddingPackageCardEmbed pkg={pkg} />
              ) : (
                <Suspense
                  fallback={
                    <div
                      className="h-[42rem] w-full shrink-0 animate-pulse rounded-2xl border border-border bg-muted/70 md:h-[56rem]"
                      aria-hidden
                    />
                  }
                >
                  <DynamicWeddingPackageCard pkg={pkg} />
                </Suspense>
              )}
            </div>
          ))}
        </div>
      </div>

      {showSwipeHint ? (
        <p className="mt-1 px-2 text-left text-[0.7rem] leading-snug text-muted-foreground md:px-6 lg:hidden">
          Geser ke samping untuk melihat paket lainnya.
        </p>
      ) : null}
    </div>
  );
}
