import type { UseQueryOptions } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";

import { API_HEALTH_QUERY_KEYS } from "@client/services/api-health/api-health.constant";
import { ApiHealthService } from "@client/services/api-health/api-health.service";
import type {
  HealthDatabaseListData,
  HealthDatabaseListError,
  HealthServerListData,
} from "@shared/types/generated/server/api-health.type";

const { GET_DATABASE_HEALTH, GET_SERVER_HEALTH } = API_HEALTH_QUERY_KEYS;

const getDatabaseHealthQueryOptions = (): UseQueryOptions<
  HealthDatabaseListData | HealthDatabaseListError,
  Error,
  HealthDatabaseListData | HealthDatabaseListError,
  typeof GET_DATABASE_HEALTH
> => {
  const { getDatabaseHealth } = ApiHealthService;

  return queryOptions({
    queryKey: GET_DATABASE_HEALTH,
    queryFn: getDatabaseHealth,
  });
};

const getServerHealthQueryOptions = (): UseQueryOptions<
  HealthServerListData,
  Error,
  HealthServerListData,
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
