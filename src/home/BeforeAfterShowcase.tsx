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
        className="relative mx-auto mt-6 aspect-[4/5] w-full max-w-lg touch-none select-none overflow-hidden rounded-2xl border border-border bg-muted shadow-lg [content-visibility:auto] md:mt-7 lg:mx-0 lg:max-w-none lg:w-full"
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
          className="pointer-events-none absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white/95 text-navy shadow-lg [transform:translate3d(-50%,-50%,0)]"
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
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={50}
        />
      </figure>
    </div>
  );
}
