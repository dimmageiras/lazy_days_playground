import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useMutationState } from "@tanstack/react-query";

import { USER_QUERY_KEYS } from "@client/services/user/user.constant";
import { UserService } from "@client/services/user/user.service";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { CheckEmailCreateData } from "@shared/types/generated/server/user.type";

const { castAsType } = TypeHelper;

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
      const data = castAsType<CheckEmailCreateData | undefined>(
        mutation.state.data,
      );

      return data?.exists ?? null;
    },
  });

  const latestMutationResult = emailExistenceMutations.at(-1) ?? null;
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
