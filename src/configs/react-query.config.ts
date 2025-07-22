import type { QueryClientProviderProps } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

const GC_TIME = 1000 * 60 * 15; // 15 minutes
const STALE_TIME = 1000 * 60 * 10; // 10 minutes

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: GC_TIME,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: STALE_TIME,
    },
  },
});

export const ReactQueryConfig = {
  client: queryClient,
} satisfies QueryClientProviderProps;
