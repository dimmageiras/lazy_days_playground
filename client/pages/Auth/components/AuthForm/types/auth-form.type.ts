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

export type { AuthFormField, AuthFormData };
