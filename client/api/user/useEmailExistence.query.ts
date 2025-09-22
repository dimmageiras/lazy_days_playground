import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useMutationState } from "@tanstack/react-query";

import { USER_QUERY_KEYS } from "@client/api/user/user.constant";
import { UserService } from "@client/api/user/user.service";
import type { CheckEmailResponse } from "@shared/types/user.type";

const useCheckEmailExists = (): UseMutationResult<
  CheckEmailResponse,
  Error,
  string
> => {
  const { checkEmailExists } = UserService;

  return useMutation({
    mutationKey: USER_QUERY_KEYS.CHECK_EMAIL,
    mutationFn: checkEmailExists,
    retry: false,
  });
};

const useEmailExistence = (): {
  isExistingUser: boolean;
  isNewUser: boolean;
  isUnchecked: boolean;
} => {
  const emailExists = useMutationState({
    filters: { mutationKey: USER_QUERY_KEYS.CHECK_EMAIL },
    select: (mutation) => {
      const data = mutation.state.data as CheckEmailResponse | undefined;

      return data?.exists ?? null;
    },
  })[0];

  const isExistingUser = emailExists === true;
  const isNewUser = emailExists === false;
  const isUnchecked = emailExists === null;

  return {
    isExistingUser,
    isNewUser,
    isUnchecked,
  };
};

export { useCheckEmailExists, useEmailExistence };
