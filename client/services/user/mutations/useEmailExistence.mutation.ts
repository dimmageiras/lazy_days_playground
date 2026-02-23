import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { USER_QUERY_KEYS } from "@client/services/user/user.constant";
import { UserService } from "@client/services/user/user.service";
import type { CheckEmailCreateData } from "@shared/types/generated/server/user.type";

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

export { useCheckEmailExists };
