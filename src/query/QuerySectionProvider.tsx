import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/query/queryClientSingleton";

/** React Query untuk blok beranda yang memuat paket wedding (tanpa menunggu route blog/admin). */
export function QuerySectionProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
