import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import beforeImg from "@/home/assets/before-after/before.webp";
import afterImg from "@/home/assets/before-after/after.webp";

/**
 * Slider di-update lewat DOM (bukan setState) agar geser tidak memicu re-render React.
 * Gambar dimuat setelah figure mendekati viewport — file before/after sebaiknya < ~500KB per file untuk web.
 */
export function BeforeAfterShowcase() {
  const figureRef = useRef<HTMLElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{ active: boolean; pointerId: number | null }>({
    active: false,
    pointerId: null,
  });

  /** Dekat viewport → mulai unduh before; setelah before selesai → unduh after (decode lebih ringan bertahap). */
  const [loadBefore, setLoadBefore] = useState(false);
  const [loadAfter, setLoadAfter] = useState(false);

  const applyPct = useCallback((raw: number) => {
    const v = Math.min(96, Math.max(4, Math.round(raw)));
    const clip = clipRef.current;
    const line = lineRef.current;
    const knob = knobRef.current;
    if (clip) clip.style.clipPath = `inset(0 0 0 ${v}%)`;
    if (line) {
      line.style.left = `${v}%`;
      line.style.transform = "translateX(-50%) translateZ(0)";
    }
    if (knob) {
      knob.style.left = `${v}%`;
    }
    const input = rangeRef.current;
    if (input) {
      input.value = String(v);
      input.setAttribute("aria-valuenow", String(v));
    }
  }, []);

  const scheduleApply = useCallback(
    (raw: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        applyPct(raw);
      });
    },
    [applyPct],
  );

  useLayoutEffect(() => {
    applyPct(50);
  }, [applyPct, loadBefore]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  useEffect(() => {
    const root = figureRef.current;
    if (!root) return;
    if (typeof IntersectionObserver === "undefined") {
      setLoadBefore(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setLoadBefore(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: "180px 0px", threshold: 0 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const root = figureRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      scheduleApply(pct);
    },
    [scheduleApply],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const root = figureRef.current;
      const input = rangeRef.current;
      if (!root || !input) return;

      // Only start drag when pointer is close to the current handle position.
      const rect = root.getBoundingClientRect();
      const currentPct = Number(input.value || 50);
      const handleX = rect.left + (currentPct / 100) * rect.width;
      const thresholdPx = 36; // forgiving on mobile; still prevents accidental touches
      const dx = Math.abs(e.clientX - handleX);

      if (dx > thresholdPx) return;

      dragRef.current.active = true;
      dragRef.current.pointerId = e.pointerId;
      root.setPointerCapture(e.pointerId);
      e.preventDefault();
      updateFromClientX(e.clientX);
    },
    [updateFromClientX],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!dragRef.current.active) return;
      e.preventDefault();
      updateFromClientX(e.clientX);
    },
    [updateFromClientX],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const root = figureRef.current;
    if (!dragRef.current.active || !root) return;
    dragRef.current.active = false;
    if (dragRef.current.pointerId !== null) {
      try {
        root.releasePointerCapture(dragRef.current.pointerId);
      } catch {
        // ignore
      }
    }
    dragRef.current.pointerId = null;
  }, []);

  return (
    <div className="min-w-0 w-full">
      <h2 className="text-center font-wedding-serif text-2xl font-bold leading-tight tracking-tight text-navy md:text-3xl lg:text-left">
        <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground md:text-base">
          Hasil editing
        </span>
        Before &amp; After
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground md:text-base lg:mx-0 lg:max-w-none lg:text-left">
        Kami mengolah file asli agar warna lebih hidup namun tetap natural. Retouch wajah
        dikerjakan selektif — keaslian riasan dan karakter tetap terjaga.
      </p>

      <figure
        ref={figureRef}
        className="relative mx-auto mt-6 aspect-[4/5] w-full max-w-lg touch-pan-y select-none overflow-hidden rounded-2xl border border-border bg-muted shadow-lg [content-visibility:auto] md:mt-7 lg:mx-0 lg:max-w-none lg:w-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {!loadBefore ? (
          <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
        ) : null}
        <img
          src={loadBefore ? beforeImg : undefined}
          alt="Foto sebelum editing"
          width={960}
          height={1200}
          sizes="(max-width: 1024px) 100vw, min(36rem, 90vw)"
          decoding="async"
          fetchPriority="low"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover [transform:translateZ(0)]"
          draggable={false}
          onLoad={() => setLoadAfter(true)}
        />
        <div
          ref={clipRef}
          className="absolute inset-0 overflow-hidden [transform:translateZ(0)]"
          style={{ clipPath: "inset(0 0 0 50%)" }}
        >
          <img
            src={loadAfter ? afterImg : undefined}
            alt="Foto setelah editing"
            width={960}
            height={1200}
            sizes="(max-width: 1024px) 100vw, min(36rem, 90vw)"
            decoding="async"
            fetchPriority="low"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover [transform:translateZ(0)]"
            draggable={false}
          />
        </div>

        <div
          ref={lineRef}
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-md"
          style={{ left: "50%", transform: "translateX(-50%) translateZ(0)" }}
        />
        <div
          ref={knobRef}
          className="pointer-events-auto absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border-2 border-white bg-white/95 text-navy shadow-lg [transform:translate3d(-50%,-50%,0)]"
          style={{ left: "50%" }}
        >
          <GripVertical className="h-6 w-6 opacity-70" aria-hidden />
        </div>

        <label className="sr-only" htmlFor="before-after-range">
          Geser untuk membandingkan foto sebelum dan sesudah editing
        </label>
        <input
          ref={rangeRef}
          id="before-after-range"
          type="range"
          min={4}
          max={96}
          defaultValue={50}
          onInput={(e) => scheduleApply(Number(e.currentTarget.value))}
          className="sr-only"
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={50}
        />
      </figure>
    </div>
  );
}
