import { QueryClient } from "@tanstack/react-query";

let queryClientSingleton: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientSingleton) {
    queryClientSingleton = new QueryClient({
      defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false },
      },
    });
  }
  return queryClientSingleton;
}
