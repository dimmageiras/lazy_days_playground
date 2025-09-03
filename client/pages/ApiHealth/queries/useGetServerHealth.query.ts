import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { ApiHealthQueriesHelper } from "@client/pages/ApiHealth/helpers/api-health-queries.helper";
import type { ApiHealthServerCheckResponse } from "@shared/types/api-health.type";

const useGetServerHealth = (): UseQueryResult<
  ApiHealthServerCheckResponse,
  Error
> => {
  const { getServerHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getServerHealthQueryOptions());
};

export { useGetServerHealth };
