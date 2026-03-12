import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

import { AUTH_QUERY_KEYS } from "@client/services/auth/auth.constant";
import { AuthService } from "@client/services/auth/auth.service";

const { AUTH_FORM_SUBMISSION } = AUTH_QUERY_KEYS;

const { submitAuthForm } = AuthService;

const useSubmitAuthFormMutation = (): UseMutationResult<
  Awaited<ReturnType<typeof submitAuthForm>>,
  Error,
  { formData: FormData }
> => {
  return useMutation({
    mutationKey: AUTH_FORM_SUBMISSION,
    mutationFn: submitAuthForm,
    retry: false,
  });
};

export { useSubmitAuthFormMutation };
