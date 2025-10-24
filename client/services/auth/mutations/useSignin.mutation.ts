import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { AUTH_QUERY_KEYS } from "@client/services/auth/auth.constants";
import { AuthService } from "@client/services/auth/auth.services";
import type {
  SigninCreateData,
  SigninCreatePayload,
} from "@shared/types/generated/auth.type";

const useSignin = (): UseMutationResult<
  SigninCreateData,
  Error,
  SigninCreatePayload
> => {
  const { signin } = AuthService;

  return useMutation({
    mutationKey: AUTH_QUERY_KEYS.SIGNIN,
    mutationFn: signin,
    retry: false,
  });
};

export { useSignin };
