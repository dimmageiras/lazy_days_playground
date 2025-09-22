import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormProps } from "react-hook-form";

import type { SignupFormData } from "@client/pages/Signin/components/AuthForm/types/auth-form.type";
import { signupRequestSchema } from "@shared/schemas/auth/signup-route.schema";

const AUTH_FORM_INITIAL_VALUES: UseFormProps<SignupFormData> = {
  defaultValues: {
    confirmPassword: "",
    email: "",
    password: "",
  },
  mode: "onTouched",
  progressive: true,
  resolver: zodResolver(signupRequestSchema),
  shouldUseNativeValidation: false,
};

export { AUTH_FORM_INITIAL_VALUES };
