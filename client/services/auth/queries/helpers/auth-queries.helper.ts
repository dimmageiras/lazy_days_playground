import type { UseQueryOptions } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";

import { AUTH_QUERY_KEYS } from "@client/services/auth/auth.constants";
import { AuthService } from "@client/services/auth/auth.services";
import type {
  GetAuthData,
  GetAuthError,
} from "@shared/types/generated/auth.type";

const { VERIFY_AUTH } = AUTH_QUERY_KEYS;

const getVerifyAuthQueryOptions = <TRequest extends Request>(
  request?: TRequest
): UseQueryOptions<
  GetAuthData,
  GetAuthError,
  GetAuthData,
  readonly [...typeof VERIFY_AUTH, typeof request]
> => {
  const { verifyAuth } = AuthService;

  return queryOptions({
    queryKey: [...VERIFY_AUTH, request] as const,
    queryFn: () => verifyAuth(request),
  });
};

export const AuthQueriesHelper = {
  getVerifyAuthQueryOptions,
};
