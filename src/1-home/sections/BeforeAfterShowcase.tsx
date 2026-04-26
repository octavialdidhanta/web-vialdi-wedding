import { useRef } from "react";
import beforeImage from "@/1-home/assets/before-after/before.webp";
import afterImage from "@/1-home/assets/before-after/after.webp";

/**
 * Slider di-update lewat DOM (bukan setState) agar geser tidak memicu re-render React.
 * Gambar dimuat setelah figure mendekati viewport — file before/after sebaiknya < ~500KB per file untuk web.
 */
export function BeforeAfterShowcase() {
  const figureRef = useRef<HTMLElement | null>(null);
  const isDraggingRef = useRef(false);

  const setPosFromClientX = (clientX: number) => {
    const el = figureRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    el.style.setProperty("--pos", String(pct));
  };

  return (
    <div className="min-w-0 w-full">
      <h2 className="text-center font-wedding-serif text-2xl font-bold leading-tight tracking-tight text-navy md:text-3xl lg:text-left">
        <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground md:text-base">
          Before / After
        </span>
        Bedanya terasa di hasil
      </h2>

      <figure
        ref={(el) => {
          figureRef.current = el;
        }}
        className="relative mx-auto mt-8 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm md:mt-10"
        style={{
          // @ts-expect-error: CSS var
          ["--pos"]: 55,
        }}
      >
        <div className="relative aspect-[3/4] w-full">
          <img
            src={beforeImage}
            alt="Before"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full select-none object-cover"
            draggable={false}
          />

          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              // Tampilkan AFTER dari divider ke kanan
              clipPath: "inset(0 0 0 calc(var(--pos) * 1%))",
            }}
            aria-hidden
          >
            <img
              src={afterImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full select-none object-cover"
              draggable={false}
            />
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 w-[2px] bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
            style={{ left: "calc(var(--pos) * 1%)" }}
            aria-hidden
          />
          {/* Drag handle (sentuhan di atas foto). Hanya handle ini yang menangkap gesture agar scroll vertikal tetap nyaman. */}
          <div
            className="absolute inset-y-0 w-10 -translate-x-1/2"
            style={{ left: "calc(var(--pos) * 1%)" }}
          >
            <button
              type="button"
              aria-label="Geser pembanding before dan after"
              className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/55 bg-gradient-to-r from-[oklch(0.48_0.2_300)] to-[oklch(0.4_0.14_305)] px-3 py-3 shadow-md"
              style={{ touchAction: "pan-y" }}
              onPointerDown={(e) => {
                isDraggingRef.current = true;
                (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                setPosFromClientX(e.clientX);
              }}
              onPointerMove={(e) => {
                if (!isDraggingRef.current) return;
                setPosFromClientX(e.clientX);
              }}
              onPointerUp={() => {
                isDraggingRef.current = false;
              }}
              onPointerCancel={() => {
                isDraggingRef.current = false;
              }}
            >
              <span className="h-2 w-2 rounded-full bg-white/90" />
            </button>
          </div>

          {/* Labels: ikut "ketutup" sesuai posisi divider */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              clipPath: "inset(0 calc(100% - (var(--pos) * 1%)) 0 0)",
            }}
            aria-hidden
          >
            <div className="absolute left-4 top-4 rounded-full border border-white/35 bg-black/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-[2px]">
              Before
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              clipPath: "inset(0 0 0 calc(var(--pos) * 1%))",
            }}
            aria-hidden
          >
            <div className="absolute right-4 top-4 rounded-full border border-white/35 bg-black/35 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-[2px]">
              After
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}
