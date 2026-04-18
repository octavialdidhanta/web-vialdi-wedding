import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Menunda render anak sampai viewport mendekati (mengurangi parse/hydrate awal + chunk opsional).
 */
export function DeferUntilVisible({
  children,
  fallback,
  rootMargin = "180px",
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    <div ref={ref}>
      {show ? children : (fallback ?? <div className="min-h-[18rem]" aria-hidden />)}
    </div>
  );
}
