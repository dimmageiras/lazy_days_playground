import type { UseMutationOptions } from "@tanstack/react-query";
import { mutationOptions } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { USER_QUERY_KEYS } from "@client/services/user/user.constant";
import { UserService } from "@client/services/user/user.service";
import type { CheckEmailCreateData } from "@shared/types/generated/server/user.type";

const { CHECK_EMAIL } = USER_QUERY_KEYS;

const getCheckEmailMutationOptions = (): UseMutationOptions<
  AxiosResponse<CheckEmailCreateData>,
  Error,
  string
> => {
  const { checkEmailExists } = UserService;

  return mutationOptions({
    mutationKey: [...CHECK_EMAIL] as const,
    mutationFn: (nextEmail) => checkEmailExists(nextEmail),
  });
};

export const UserMutationsHelper = {
  getCheckEmailMutationOptions,
};
