import type { UseFormProps } from "react-hook-form";

import { authFormSchema } from "@client/pages/Auth/components/AuthForm/schemas/auth-form.schema";
import type { AuthFormData } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";
import { zResolver } from "@shared/wrappers/zod.wrapper";

const AUTH_FORM_INITIAL_VALUES: UseFormProps<AuthFormData> = {
  defaultValues: {
    confirmPassword: "",
    email: "",
    mode: "signup",
    password: "",
  },
  mode: "onTouched",
  progressive: true,
  resolver: zResolver(authFormSchema),
  shouldUseNativeValidation: false,
};

export { AUTH_FORM_INITIAL_VALUES };
