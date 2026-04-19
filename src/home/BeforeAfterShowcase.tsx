import { useState } from "react";
import { GripVertical } from "lucide-react";

const BEFORE_SRC =
  "https://jasafotowedding.com/wp-content/uploads/2023/08/before2.png";
const AFTER_SRC = "https://jasafotowedding.com/wp-content/uploads/2023/08/after2.png";

export function BeforeAfterShowcase() {
  const [pct, setPct] = useState(50);

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

      <figure className="relative mx-auto mt-6 aspect-[4/5] w-full max-w-lg select-none overflow-hidden rounded-2xl border border-border bg-muted shadow-lg md:mt-7 lg:mx-0 lg:max-w-none lg:w-full">
        <img
          src={BEFORE_SRC}
          alt="Foto sebelum editing"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${pct}%)` }}
        >
          <img
            src={AFTER_SRC}
            alt="Foto setelah editing"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-md"
          style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
        />
        <div
          className="pointer-events-none absolute top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white/95 text-navy shadow-lg"
          style={{ left: `${pct}%` }}
        >
          <GripVertical className="h-6 w-6 opacity-70" aria-hidden />
        </div>

        <label className="sr-only" htmlFor="before-after-range">
          Geser untuk membandingkan foto sebelum dan sesudah editing
        </label>
        <input
          id="before-after-range"
          type="range"
          min={4}
          max={96}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={pct}
        />
      </figure>
    </div>
  );
}
