import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { API_HEALTH_QUERY_KEYS } from "@client/pages/ApiHealth/constants/api-health.constant";
import { ApiHealthService } from "@client/pages/ApiHealth/services/api-health.service";
import type {
  ApiHealthServerErrorResponse,
  ApiHealthServerSuccessResponse,
} from "@shared/types/api-health.type";

type UseGetServerHealthResult = UseQueryResult<
  ApiHealthServerErrorResponse | ApiHealthServerSuccessResponse,
  Error
>;

/**
 * React Query hook for fetching server health status
 *
 * @returns UseQueryResult with server health data including success or error responses
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useGetServerHealth();
 *
 * if (data?.status === API_HEALTH_STATUSES.HEALTHY) {
 *   console.log('Server is healthy:', data.service);
 * } else {
 *   console.log('Server issue:', data?.error);
 * }
 * ```
 */
const useGetServerHealth = (): UseGetServerHealthResult => {
  return useQuery({
    queryKey: API_HEALTH_QUERY_KEYS.GET_SERVER_HEALTH,
    queryFn: ApiHealthService.getServerHealth,
  });
};

export { useGetServerHealth };
