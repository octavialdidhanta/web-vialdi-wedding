import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";

let queryClientSingleton: QueryClient | null = null;

function getQueryClient(): QueryClient {
  if (!queryClientSingleton) {
    queryClientSingleton = new QueryClient({
      defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false },
      },
    });
  }
  return queryClientSingleton;
}

/**
 * Provider React Query untuk beranda, blog, admin.
 * Import sinkron agar `/` bisa merender hero di paint pertama (tanpa menunggu `useEffect` + dynamic import).
 */
export function QueryRoutesLayout() {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <Outlet />
    </QueryClientProvider>
  );
}
