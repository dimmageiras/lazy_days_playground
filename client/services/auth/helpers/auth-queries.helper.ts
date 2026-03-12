import type { UseQueryOptions } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { AUTH_QUERY_KEYS } from "@client/services/auth/auth.constant";
import { AuthService } from "@client/services/auth/auth.service";
import type {
  SigninCreateData,
  SigninCreatePayload,
  SignupCreateData,
  SignupCreatePayload,
  VerifyAuthListData,
  VerifyAuthListError,
} from "@shared/types/generated/server/auth.type";

const { SIGNIN, SIGNUP, VERIFY_AUTH } = AUTH_QUERY_KEYS;

const { signin, signup, verifyAuth } = AuthService;

const getSigninQueryOptions = (
  payload: SigninCreatePayload,
): UseQueryOptions<
  AxiosResponse<SigninCreateData>,
  Error,
  AxiosResponse<SigninCreateData>,
  readonly [...typeof SIGNIN, SigninCreatePayload]
> => {
  return queryOptions({
    queryKey: [...SIGNIN, payload] as const,
    queryFn: () => signin(payload),
  });
};

const getSignupQueryOptions = (
  payload: SignupCreatePayload,
): UseQueryOptions<
  AxiosResponse<SignupCreateData>,
  Error,
  AxiosResponse<SignupCreateData>,
  readonly [...typeof SIGNUP, SignupCreatePayload]
> => {
  return queryOptions({
    queryKey: [...SIGNUP, payload] as const,
    queryFn: () => signup(payload),
  });
};

const getVerifyAuthQueryOptions = (
  clientId: string,
): UseQueryOptions<
  AxiosResponse<VerifyAuthListData>,
  VerifyAuthListError,
  AxiosResponse<VerifyAuthListData>,
  readonly [...typeof VERIFY_AUTH, typeof clientId]
> => {
  return queryOptions({
    queryKey: [...VERIFY_AUTH, clientId] as const,
    queryFn: () => verifyAuth(),
  });
};

export const AuthQueriesHelper = {
  getSigninQueryOptions,
  getSignupQueryOptions,
  getVerifyAuthQueryOptions,
};
