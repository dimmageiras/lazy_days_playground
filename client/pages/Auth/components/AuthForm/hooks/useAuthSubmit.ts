import type { UseFormReturn } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";

import { FORM_MODES } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import type { AuthFormData } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";
import { useSignin, useSignup } from "@client/services/auth";
import { useCheckEmailExists } from "@client/services/user";

const { CHECK_EMAIL, SIGNIN, SIGNUP } = FORM_MODES;

const useAuthSubmit = (
  formMethods: UseFormReturn<AuthFormData>,
): {
  onValid: (data: AuthFormData) => Promise<void>;
} => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const checkEmailExistsMutation = useCheckEmailExists();
  const signinMutation = useSignin();
  const signupMutation = useSignup();

  const onValid = async (data: AuthFormData): Promise<void> => {
    if (data.mode === CHECK_EMAIL) {
      const { email } = data;

      const { exists } = await checkEmailExistsMutation.mutateAsync(email);

      if (exists) {
        formMethods.setValue("mode", SIGNIN);
      } else {
        formMethods.setValue("mode", SIGNUP);
      }
    } else {
      if (data.mode === SIGNIN) {
        const { email, password } = data;

        await signinMutation.mutateAsync({ email, password });
      } else if (data.mode === SIGNUP) {
        const { confirmPassword, email, password } = data;

        await signupMutation.mutateAsync({ confirmPassword, email, password });
      }

      formMethods.reset();

      const redirectTo = searchParams.get("redirect") || "/";

      navigate(redirectTo, { replace: true });
    }
  };

  return {
    onValid,
  };
};

export { useAuthSubmit };
