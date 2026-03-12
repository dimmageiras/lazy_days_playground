import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { AUTH_QUERY_KEYS } from "@client/services/auth/auth.constant";
import { AuthService } from "@client/services/auth/auth.service";
import type {
  LogoutCreateData,
  LogoutCreatePayload,
} from "@shared/types/generated/server/auth.type";

const { LOGOUT } = AUTH_QUERY_KEYS;

const { logout } = AuthService;

const useLogout = (): UseMutationResult<
  AxiosResponse<LogoutCreateData>,
  Error,
  LogoutCreatePayload
> => {
  return useMutation({
    mutationKey: LOGOUT,
    mutationFn: logout,
    retry: false,
  });
};

export { useLogout };
