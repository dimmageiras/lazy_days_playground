import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { HealthServerListResponse } from "@shared/types/api-health.type";

import { ApiHealthQueriesHelper } from "./helpers/api-health-queries.helper";

const useGetServerHealth = (): UseQueryResult<
  HealthServerListResponse,
  Error
> => {
  const { getServerHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getServerHealthQueryOptions());
};

export { useGetServerHealth };
