import { lazy, Suspense, useEffect, useState } from "react";

const MobileHomeStickyFooter = lazy(() =>
  import("@/1-home/components/MobileHomeStickyFooter").then((m) => ({
    default: m.MobileHomeStickyFooter,
  })),
);

export function DeferredMobileHomeStickyFooter(props: {
  instagramId: string;
  hargaPaketId: string;
  garansiId: string;
  faqId: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const enable = () => setReady(true);
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(enable, { timeout: 6000 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(enable, 3000);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <MobileHomeStickyFooter {...props} />
    </Suspense>
  );
}
