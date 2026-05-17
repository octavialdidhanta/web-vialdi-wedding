import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { getQueryClient } from "@/query/queryClientSingleton";

/** Provider React Query untuk blog & admin (bukan cold start beranda). */
export function QueryRoutesLayout() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <Outlet />
    </QueryClientProvider>
  );
}
