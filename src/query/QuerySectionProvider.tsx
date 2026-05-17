import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQueryClient } from "@/query/queryClientSingleton";

/** React Query hanya untuk subtree (mis. paket beranda) — bukan cold start `/`. */
export function QuerySectionProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
