import type { AUTH_FORM_MODES } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import type { authFormSchema } from "@client/pages/Auth/components/AuthForm/schemas/auth-form.schema";
import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

type AuthFormData = ZodInfer<typeof authFormSchema>;

type AuthFormField = Exclude<
  AuthFormData extends infer TBranch
    ? TBranch extends Record<string, unknown>
      ? keyof TBranch
      : never
    : never,
  "mode"
>;

type CheckEmailPayload = Extract<
  AuthFormData,
  { mode: typeof AUTH_FORM_MODES.CHECK_EMAIL }
>;

type CheckEmailSuccess = Pick<AuthFormData, "email" | "mode">;

type SigninPayload = Extract<
  AuthFormData,
  { mode: typeof AUTH_FORM_MODES.SIGNIN }
>;

type SignupPayload = Extract<
  AuthFormData,
  { mode: typeof AUTH_FORM_MODES.SIGNUP }
>;

export type {
  AuthFormData,
  AuthFormField,
  CheckEmailPayload,
  CheckEmailSuccess,
  SigninPayload,
  SignupPayload,
};
