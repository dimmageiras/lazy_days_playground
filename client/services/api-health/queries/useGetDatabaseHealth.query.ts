import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type {
  HealthDatabaseListData,
  HealthDatabaseListError,
} from "@shared/types/generated/api-health.type";

import { ApiHealthQueriesHelper } from "./helpers/api-health-queries.helper";

const useGetDatabaseHealth = (): UseQueryResult<
  HealthDatabaseListData | HealthDatabaseListError,
  Error
> => {
  const { getDatabaseHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getDatabaseHealthQueryOptions());
};

export { useGetDatabaseHealth };
