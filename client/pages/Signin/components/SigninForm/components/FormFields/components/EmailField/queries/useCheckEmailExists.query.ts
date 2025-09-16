import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { USER_QUERY_KEYS } from "@client/pages/Signin/components/SigninForm/components/FormFields/components/EmailField/constants/user.constant";
import { UserService } from "@client/pages/Signin/components/SigninForm/components/FormFields/components/EmailField/services/user.service";
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
