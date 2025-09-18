import type { UseQueryOptions } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";

import { API_HEALTH_QUERY_KEYS } from "@client/api/api-health/api-health.constant";
import { ApiHealthService } from "@client/api/api-health/api-health.service";
import type {
  ApiHealthDatabaseCheckResponse,
  ApiHealthServerCheckResponse,
} from "@shared/types/api-health.type";

const { GET_DATABASE_HEALTH, GET_SERVER_HEALTH } = API_HEALTH_QUERY_KEYS;

const getDatabaseHealthQueryOptions = (): UseQueryOptions<
  ApiHealthDatabaseCheckResponse,
  Error,
  ApiHealthDatabaseCheckResponse,
  typeof GET_DATABASE_HEALTH
> => {
  const { getDatabaseHealth } = ApiHealthService;

  return queryOptions({
    queryKey: GET_DATABASE_HEALTH,
    queryFn: getDatabaseHealth,
  });
};

const getServerHealthQueryOptions = (): UseQueryOptions<
  ApiHealthServerCheckResponse,
  Error,
  ApiHealthServerCheckResponse,
  typeof GET_SERVER_HEALTH
> => {
  const { getServerHealth } = ApiHealthService;

  return queryOptions({
    queryKey: GET_SERVER_HEALTH,
    queryFn: getServerHealth,
  });
};

export const ApiHealthQueriesHelper = {
  getDatabaseHealthQueryOptions,
  getServerHealthQueryOptions,
};
