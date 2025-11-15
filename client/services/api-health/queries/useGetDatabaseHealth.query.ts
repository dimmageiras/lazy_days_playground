import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { ApiHealthQueriesHelper } from "@client/services/api-health/helpers/api-health-queries.helper";
import type {
  HealthDatabaseListData,
  HealthDatabaseListError,
} from "@shared/types/generated/server/api-health.type";

const useGetDatabaseHealth = (): UseQueryResult<
  HealthDatabaseListData | HealthDatabaseListError,
  Error
> => {
  const { getDatabaseHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getDatabaseHealthQueryOptions());
};

export { useGetDatabaseHealth };
