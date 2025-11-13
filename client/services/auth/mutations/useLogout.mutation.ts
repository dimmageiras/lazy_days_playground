import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { AUTH_QUERY_KEYS } from "@client/services/auth/auth.constants";
import { AuthService } from "@client/services/auth/auth.services";
import type {
  LogoutCreateData,
  LogoutCreatePayload,
} from "@shared/types/generated/auth.type";

const useLogout = (): UseMutationResult<
  LogoutCreateData,
  Error,
  LogoutCreatePayload
> => {
  const { LOGOUT } = AUTH_QUERY_KEYS;

  const { logout } = AuthService;

  return useMutation({
    mutationKey: LOGOUT,
    mutationFn: logout,
    retry: false,
  });
};

export { useLogout };
