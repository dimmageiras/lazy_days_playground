import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { HealthDatabaseListResponse } from "@shared/types/api-health.type";

import { ApiHealthQueriesHelper } from "./helpers/api-health-queries.helper";

const useGetDatabaseHealth = (): UseQueryResult<
  HealthDatabaseListResponse,
  Error
> => {
  const { getDatabaseHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getDatabaseHealthQueryOptions());
};

export { useGetDatabaseHealth };
