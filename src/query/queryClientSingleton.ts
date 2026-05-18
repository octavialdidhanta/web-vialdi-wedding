import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

/** Satu klien untuk beranda (paket) + blog/admin agar cache invalidation konsisten. */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          retry: 1,
        },
      },
    });
  }
  return queryClient;
}
