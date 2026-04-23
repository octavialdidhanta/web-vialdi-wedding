import { useEffect, useState } from "react";

/** Indikator progres baca — netral, tanpa gradasi. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;

    const measure = () => {
      raf = 0;
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) {
        setPct(100);
        return;
      }
      setPct(Math.min(100, Math.max(0, (el.scrollTop / scrollable) * 100)));
    };

    const schedule = () => {
      if (raf !== 0) return;
      raf = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-16 z-[45] h-px bg-border"
      aria-hidden
    >
      <div
        className="h-full bg-navy transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
