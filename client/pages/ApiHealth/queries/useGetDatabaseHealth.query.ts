import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { ApiHealthQueriesHelper } from "@client/pages/ApiHealth/helpers/api-health-queries.helper";
import type { ApiHealthDatabaseCheckResponse } from "@shared/types/api-health.type";

const useGetDatabaseHealth = (): UseQueryResult<
  ApiHealthDatabaseCheckResponse,
  Error
> => {
  const { getDatabaseHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getDatabaseHealthQueryOptions());
};

export { useGetDatabaseHealth };
