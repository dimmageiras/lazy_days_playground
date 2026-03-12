import type { UseFormProps } from "react-hook-form";

import { authFormSchema } from "@client/pages/Auth/components/AuthForm/schemas/auth-form.schema";
import type { AuthFormData } from "@client/types/auth.type";
import { zResolver } from "@shared/wrappers/zod.wrapper";

const AUTH_FORM_FIELDS = Object.freeze({
  CONFIRM_PASSWORD: { label: "Confirm password", name: "confirmPassword" },
  EMAIL: { label: "Email address", name: "email" },
  PASSWORD: { label: "Password", name: "password" },
} as const);

const AUTH_FORM_MODES = Object.freeze({
  CHECK_EMAIL: "checkEmail",
  SIGNIN: "signin",
  SIGNUP: "signup",
} as const);

const AUTH_FORM_INITIAL_VALUES: UseFormProps<AuthFormData> = {
  defaultValues: {
    email: "",
    mode: AUTH_FORM_MODES.CHECK_EMAIL,
  },
  mode: "onTouched",
  progressive: true,
  resolver: zResolver(authFormSchema),
  reValidateMode: "onBlur",
  shouldUseNativeValidation: false,
};

export { AUTH_FORM_INITIAL_VALUES, AUTH_FORM_FIELDS, AUTH_FORM_MODES };
