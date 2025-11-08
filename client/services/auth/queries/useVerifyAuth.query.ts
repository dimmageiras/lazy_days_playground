import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import type {
  VerifyAuthListData,
  VerifyAuthListError,
} from "@shared/types/generated/auth.type";

import { AuthQueriesHelper } from "./helpers/auth-queries.helper";

const useVerifyAuth = (): UseQueryResult<
  VerifyAuthListData,
  VerifyAuthListError
> => {
  const { getVerifyAuthQueryOptions } = AuthQueriesHelper;

  return useQuery(getVerifyAuthQueryOptions());
};

export { useVerifyAuth };
