import type { QueryClientProviderProps } from "@tanstack/react-query";

import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const ReactQueryConfig = {
  client: queryClient,
} satisfies QueryClientProviderProps;
