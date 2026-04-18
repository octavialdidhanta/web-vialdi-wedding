import { useEffect, useState } from "react";

/** Indikator progres baca — netral, tanpa gradasi. */
export function ReadingProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable <= 0) {
        setPct(100);
        return;
      }
      setPct(Math.min(100, Math.max(0, (el.scrollTop / scrollable) * 100)));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
