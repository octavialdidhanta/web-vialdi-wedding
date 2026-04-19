import type { QueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

let queryClientSingleton: QueryClient | null = null;
let rqModuleSingleton: typeof import("@tanstack/react-query") | null = null;

/**
 * Memuat React Query hanya untuk rute yang memakainya (blog + admin),
 * sehingga bundle utama tidak menarik query-core / mutation untuk pengunjung beranda.
 */
export function QueryRoutesLayout() {
  const [rq, setRq] = useState<typeof import("@tanstack/react-query") | null>(
    () => rqModuleSingleton,
  );

  useEffect(() => {
    if (rqModuleSingleton) {
      setRq(rqModuleSingleton);
      return;
    }
    let cancelled = false;
    void import("@tanstack/react-query").then((m) => {
      if (cancelled) return;
      rqModuleSingleton = m;
      if (!queryClientSingleton) {
        queryClientSingleton = new m.QueryClient({
          defaultOptions: {
            queries: { retry: 1, refetchOnWindowFocus: false },
          },
        });
      }
      setRq(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rq || !queryClientSingleton) {
    return (
      <div
        className="flex min-h-[50vh] w-full items-center justify-center bg-background"
        aria-busy="true"
        aria-live="polite"
      >
        <p className="text-sm text-muted-foreground">Memuat…</p>
      </div>
    );
  }

  const { QueryClientProvider } = rq;
  return (
    <QueryClientProvider client={queryClientSingleton}>
      <Outlet />
    </QueryClientProvider>
  );
}
