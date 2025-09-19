import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

import type {
  signinRequestSchema,
  signinResponseSchema,
} from "../schemas/auth/signin-route.schema";
import type {
  signupRequestSchema,
  signupResponseSchema,
} from "../schemas/auth/signup-route.schema";
import type {
  verifyRequestSchema,
  verifyResponseSchema,
} from "../schemas/auth/verify-route.schema";

type SigninRequest = ZodInfer<typeof signinRequestSchema>;
type SigninResponse = ZodInfer<typeof signinResponseSchema>;

type SignupRequest = ZodInfer<typeof signupRequestSchema>;
type SignupResponse = ZodInfer<typeof signupResponseSchema>;

type VerifyRequest = ZodInfer<typeof verifyRequestSchema>;
type VerifyResponse = ZodInfer<typeof verifyResponseSchema>;

export type {
  SigninRequest,
  SigninResponse,
  SignupRequest,
  SignupResponse,
  VerifyRequest,
  VerifyResponse,
};
