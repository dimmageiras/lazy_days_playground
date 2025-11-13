import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useMutationState } from "@tanstack/react-query";

import { USER_QUERY_KEYS } from "@client/services/user/user.constant";
import { UserService } from "@client/services/user/user.service";
import type { CheckEmailCreateData } from "@shared/types/generated/user.type";

const useCheckEmailExists = (): UseMutationResult<
  CheckEmailCreateData,
  Error,
  string
> => {
  const { CHECK_EMAIL } = USER_QUERY_KEYS;

  const { checkEmailExists } = UserService;

  return useMutation({
    mutationKey: CHECK_EMAIL,
    mutationFn: checkEmailExists,
    retry: false,
  });
};

const useEmailExistence = (): {
  isExistingUser: boolean;
  isNewUser: boolean;
  isUnchecked: boolean;
} => {
  const { CHECK_EMAIL } = USER_QUERY_KEYS;

  const emailExistenceMutations = useMutationState({
    filters: { mutationKey: CHECK_EMAIL },
    select: (mutation) => {
      const data = mutation.state.data as CheckEmailCreateData | undefined;

      return data?.exists ?? null;
    },
  });

  const latestMutationResult =
    emailExistenceMutations[emailExistenceMutations.length - 1] ?? null;
  const emailExists = latestMutationResult;

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
