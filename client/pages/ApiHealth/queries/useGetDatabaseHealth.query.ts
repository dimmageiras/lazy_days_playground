import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { API_HEALTH_QUERY_KEYS } from "@client/pages/ApiHealth/constants/api-health.constant";
import { ApiHealthService } from "@client/pages/ApiHealth/services/api-health.service";
import type {
  ApiHealthDbConnectionErrorResponse,
  ApiHealthDbDsnErrorResponse,
  ApiHealthDbSuccessResponse,
} from "@shared/types/api-health.type";

type UseGetDatabaseHealthResult = UseQueryResult<
  | ApiHealthDbConnectionErrorResponse
  | ApiHealthDbDsnErrorResponse
  | ApiHealthDbSuccessResponse,
  Error
>;

/**
 * React Query hook for fetching database health status
 *
 * @returns UseQueryResult with database health data including success, DSN error, or connection error responses
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useGetDatabaseHealth();
 *
 * if (data?.status === API_HEALTH_STATUSES.HEALTHY) {
 *   console.log('Database is healthy:', data.database);
 * } else {
 *   console.log('Database issue:', data?.error);
 * }
 * ```
 */
const useGetDatabaseHealth = (): UseGetDatabaseHealthResult => {
  return useQuery({
    queryKey: API_HEALTH_QUERY_KEYS.GET_DATABASE_HEALTH,
    queryFn: ApiHealthService.getDatabaseHealth,
  });
};

export { useGetDatabaseHealth };
