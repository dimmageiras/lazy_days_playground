import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import { useClientSessionTrackedStore } from "@client/providers/ClientSessionProvider";
import { AuthQueriesHelper } from "@client/services/auth/helpers/auth-queries.helper";
import type {
  VerifyAuthListData,
  VerifyAuthListError,
} from "@shared/types/generated/server/auth.type";

const useVerifyAuth = (): UseQueryResult<
  VerifyAuthListData,
  VerifyAuthListError
> => {
  const { clientId, isAuthenticated } = useClientSessionTrackedStore();

  const { getVerifyAuthQueryOptions } = AuthQueriesHelper;

  return useQuery({
    ...getVerifyAuthQueryOptions(clientId),
    enabled: isAuthenticated,
  });
};

export { useVerifyAuth };
