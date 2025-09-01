import type { LoaderFunctionArgs } from "react-router";

import { ReactQueryConfig } from "@client/configs/react-query.config";

import { ApiHealthService } from "./services/api-health.service";

/**
 * API Health page loader for SSR data prefetching
 *
 * Prefetches both server and database health status on the server side
 * to provide immediate data availability when the page loads.
 *
 * @param args - React Router loader function arguments
 * @returns Promise resolving to prefetched health data
 *
 * @example
 * Route configuration:
 * ```ts
 * route("/api/health", "pages/ApiHealth/index.ts", {
 *   loader: () => import("./loader.ts").then(m => m.loader)
 * })
 * ```
 */
const loader = async ({
  request: _request,
}: LoaderFunctionArgs): Promise<{
  dehydratedState: unknown;
  error?: string;
  timestamp: string;
}> => {
  const { client } = ReactQueryConfig;

  try {
    await client.prefetchQuery({
      queryKey: ["api-health", "server"],
      queryFn: ApiHealthService.getServerHealth,
    });

    await client.prefetchQuery({
      queryKey: ["api-health", "database"],
      queryFn: ApiHealthService.getDatabaseHealth,
    });

    return {
      dehydratedState: client.getQueryData(["api-health"]),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to prefetch API health data:", error);

    return {
      dehydratedState: null,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
};

export { loader };
