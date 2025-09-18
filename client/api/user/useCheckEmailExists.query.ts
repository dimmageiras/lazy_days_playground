import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

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

export { useCheckEmailExists };
