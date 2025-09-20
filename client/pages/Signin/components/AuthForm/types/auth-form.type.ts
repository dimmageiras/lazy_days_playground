import type { signinRequestSchema } from "@shared/schemas/auth/signin-route.schema";
import type { signupRequestSchema } from "@shared/schemas/auth/signup-route.schema";
import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

type SigninFormData = ZodInfer<typeof signinRequestSchema>;

type SignupFormData = ZodInfer<typeof signupRequestSchema>;

export type { SigninFormData, SignupFormData };
