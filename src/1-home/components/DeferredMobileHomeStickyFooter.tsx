import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";

const MobileHomeStickyFooter = lazy(() =>
  import("@/1-home/components/MobileHomeStickyFooter").then((m) => ({
    default: m.MobileHomeStickyFooter,
  })),
);

type Props = ComponentProps<typeof MobileHomeStickyFooter>;

/** Footer sticky mobile — parse/eval ditunda setelah idle agar tidak membebani LCP beranda. */
export function DeferredMobileHomeStickyFooter(props: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const arm = () => setShow(true);
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(arm, { timeout: 4500 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(arm, 2500);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <Suspense fallback={null}>
      <MobileHomeStickyFooter {...props} />
    </Suspense>
  );
}
