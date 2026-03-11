import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { ApiHealthQueriesHelper } from "@client/services/api-health/helpers/api-health-queries.helper";
import type { HealthServerListData } from "@shared/types/generated/server/api-health.type";

const useGetServerHealth = (): UseQueryResult<
  AxiosResponse<HealthServerListData>,
  Error
> => {
  const { getServerHealthQueryOptions } = ApiHealthQueriesHelper;

  return useQuery(getServerHealthQueryOptions());
};

export { useGetServerHealth };
