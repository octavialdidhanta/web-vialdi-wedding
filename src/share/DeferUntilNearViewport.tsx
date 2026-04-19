import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/share/lib/utils";

type DeferUntilNearViewportProps = {
  children: ReactNode;
  /** Jarak ekstra sebelum elemen masuk viewport untuk mulai memuat (IntersectionObserver rootMargin). */
  rootMargin?: string;
  className?: string;
  /** Diterapkan saat konten belum dimuat — cegah CLS dengan cadangan tinggi perkiraan. */
  placeholderClassName?: string;
};

/**
 * Menunda render `children` sampai wrapper mendekati viewport.
 * Dipakai bersama `React.lazy` agar parse/eval bundle berat tidak terjadi di awal Home.
 */
export function DeferUntilNearViewport({
  children,
  rootMargin = "320px 0px 200px 0px",
  className,
  placeholderClassName,
}: DeferUntilNearViewportProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {show ? (
        children
      ) : (
        <div className={cn("w-full", placeholderClassName)} aria-hidden />
      )}
    </div>
  );
}
