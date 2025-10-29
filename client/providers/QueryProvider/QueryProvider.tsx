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
import { TIMING } from "@shared/constants/timing.constant";

const { MINUTES_FIFTEEN_IN_MS, MINUTES_TEN_IN_MS } = TIMING;

const QueryProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: MINUTES_FIFTEEN_IN_MS,
            refetchOnWindowFocus: false,
            retry: false,
            staleTime: MINUTES_TEN_IN_MS,
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

export { QueryProvider };
