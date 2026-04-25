import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AgencyPackageRow } from "@/agency/agencyPackages";
import { fetchPublishedAgencyPackages } from "@/agency/agencyPackages";

const DynamicAgencyPackageCard = lazy(() =>
  import("@/home/DynamicAgencyPackageCard").then((m) => ({ default: m.DynamicAgencyPackageCard })),
);

export const agencyPackageCarouselCardShell =
  "min-w-[19rem] w-[min(25rem,calc(100vw-2rem))] max-w-[28rem] shrink-0 snap-start snap-always self-stretch md:flex md:h-[56rem] md:max-h-[56rem] md:min-h-0 md:min-w-[21rem] md:w-[min(28rem,calc(100vw-3rem))] md:flex-col";

const BOUNCE_TICK_MS = 3000;
const FIRST_BOUNCE_MS = 900;
const AT_FIRST_CARD_MAX_SCROLL_PX = 20;
const USER_DISCOVERED_HORIZONTAL_SCROLL_PX = 36;

export type AgencyPackageKind = "ads" | "landing" | "content" | "fullfunnel" | "all";

export function AgencyPackageCarouselStrip({
  showSwipeHint = true,
  kind = "all",
}: {
  showSwipeHint?: boolean;
  kind?: AgencyPackageKind;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ["agency-packages-carousel", "home"],
    queryFn: fetchPublishedAgencyPackages,
    enabled: true,
  });

  const rowsAll = useMemo(() => (query.data ?? []) as AgencyPackageRow[], [query.data]);
  const rows = useMemo(() => {
    if (kind === "all") return rowsAll;
    if (kind === "ads") return rowsAll.filter((r) => r.badge_label.toLowerCase().includes("ads"));
    if (kind === "landing") return rowsAll.filter((r) => r.badge_label.toLowerCase().includes("landing"));
    if (kind === "content") return rowsAll.filter((r) => r.badge_label.toLowerCase().includes("content"));
    return rowsAll.filter((r) => r.badge_label.toLowerCase().includes("full funnel"));
  }, [rowsAll, kind]);

  const orderedIdsKey = `${kind}:${rows.map((r) => r.id).join(",")}`;

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
  }, [orderedIdsKey]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: "smooth" });
  }, [kind]);

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
        aria-label={
          kind === "ads"
            ? "Daftar paket ads — geser horizontal untuk melihat paket lainnya"
            : kind === "landing"
              ? "Daftar paket landing page — geser horizontal untuk melihat paket lainnya"
              : kind === "content"
                ? "Daftar paket content — geser horizontal untuk melihat paket lainnya"
                : kind === "fullfunnel"
                  ? "Daftar paket full funnel — geser horizontal untuk melihat paket lainnya"
              : "Daftar paket — geser horizontal untuk melihat paket lainnya"
        }
      >
        <div ref={trackRef} className="flex w-max flex-nowrap items-stretch gap-2 px-2 sm:gap-3 md:gap-4 md:px-0">
          {rows.map((pkg) => (
            <div key={pkg.id} className={agencyPackageCarouselCardShell}>
              <Suspense
                fallback={
                  <div
                    className="h-[42rem] w-full shrink-0 animate-pulse rounded-2xl border border-border bg-muted/70 md:h-[56rem]"
                    aria-hidden
                  />
                }
              >
                <DynamicAgencyPackageCard pkg={pkg} />
              </Suspense>
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

