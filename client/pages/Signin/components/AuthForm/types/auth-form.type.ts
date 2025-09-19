import type {
  signinSchema,
  signupSchema,
} from "@client/pages/Signin/components/AuthForm/schemas/auth-form.schema";
import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

type SigninFormData = ZodInfer<typeof signinSchema>;

type SignupFormData = ZodInfer<typeof signupSchema>;

export type { SigninFormData, SignupFormData };
