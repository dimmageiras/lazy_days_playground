import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { JSX, PropsWithChildren } from "react";
import { useState } from "react";

import { useDehydratedState } from "@client/hooks/useDehydratedState";
import {
  HAS_DEV_TOOLS,
  IS_DEVELOPMENT,
} from "@shared/constants/root-env.constant";

const GC_TIME = 1000 * 60 * 15; // 15 minutes
const STALE_TIME = 1000 * 60 * 10; // 10 minutes

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  const [queryClient] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: GC_TIME,
          refetchOnWindowFocus: false,
          retry: false,
          staleTime: STALE_TIME,
        },
      },
    })
  );
  const dehydratedState = useDehydratedState();

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>{children}</HydrationBoundary>
      {IS_DEVELOPMENT && HAS_DEV_TOOLS ? <ReactQueryDevtools /> : null}
    </QueryClientProvider>
  );
};

export { AppProviders };
