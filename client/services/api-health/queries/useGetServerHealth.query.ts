import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type { HealthServerListData } from "@shared/types/generated/api-health.type";

import { ApiHealthQueriesHelper } from "./helpers/api-health-queries.helper";

const useGetServerHealth = (): UseQueryResult<HealthServerListData, Error> => {
  const { getServerHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getServerHealthQueryOptions());
};

export { useGetServerHealth };
