import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { ApiHealthQueriesHelper } from "@client/services/api-health/helpers/api-health-queries.helper";
import type { HealthServerListData } from "@shared/types/generated/api-health.type";

const useGetServerHealth = (): UseQueryResult<HealthServerListData, Error> => {
  const { getServerHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getServerHealthQueryOptions());
};

export { useGetServerHealth };
