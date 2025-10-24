import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { AUTH_QUERY_KEYS } from "@client/services/auth/auth.constants";
import { AuthService } from "@client/services/auth/auth.services";
import type {
  SignupCreateData,
  SignupCreatePayload,
} from "@shared/types/generated/auth.type";

const useSignup = (): UseMutationResult<
  SignupCreateData,
  Error,
  SignupCreatePayload
> => {
  const { signup } = AuthService;

  return useMutation({
    mutationKey: AUTH_QUERY_KEYS.SIGNUP,
    mutationFn: signup,
    retry: false,
  });
};

export { useSignup };
