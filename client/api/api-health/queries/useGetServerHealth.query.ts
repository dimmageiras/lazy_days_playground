import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { ApiHealthServerCheckResponse } from "@shared/types/api-health.type";

import { ApiHealthQueriesHelper } from "./helpers/api-health-queries.helper";

const useGetServerHealth = (): UseQueryResult<
  ApiHealthServerCheckResponse,
  Error
> => {
  const { getServerHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getServerHealthQueryOptions());
};

export { useGetServerHealth };
