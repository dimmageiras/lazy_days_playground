import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useMutationState } from "@tanstack/react-query";

import { IS_EXISTING_USER } from "@client/constants/user.constants";
import { StringUtilsHelper } from "@client/helpers/string-utils.helper";
import { USER_QUERY_KEYS } from "@client/services/user/user.constant";
import { UserService } from "@client/services/user/user.service";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { CheckEmailCreateData } from "@shared/types/generated/server/user.type";

const { toUpperCase } = StringUtilsHelper;
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

const useEmailExistence =
  (): (typeof IS_EXISTING_USER)[keyof typeof IS_EXISTING_USER] => {
    const { CHECK_EMAIL } = USER_QUERY_KEYS;

    const emailExistenceMutations = useMutationState({
      filters: { mutationKey: CHECK_EMAIL },
      select: (mutation) => {
        const data = castAsType<CheckEmailCreateData | undefined>(
          mutation.state.data,
        );

        return data?.exists;
      },
    });

    const value = toUpperCase(`${emailExistenceMutations.at(-1) ?? null}`);
    const isExistingUser = Reflect.get(IS_EXISTING_USER, value);

    return isExistingUser;
  };

export { useCheckEmailExists, useEmailExistence };
