import {
  zEmail,
  zEnum,
  zIsoDateTime,
  zObject,
  zString,
} from "../../../shared/wrappers/zod.wrapper.ts";
import { createBaseRateLimitErrorSchema } from "../common/base-rate-limit-error.schema.ts";
import { passwordValidationSchema } from "../common/user/password.schema.ts";

const signupErrorSchema = zObject({
  details: zString().optional().meta({
    description: "Additional error details (only present for caught errors)",
    example: "Email already exists",
  }),
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Registration failed",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when signup fails",
});

const signupRateLimitErrorSchema = createBaseRateLimitErrorSchema({
  detailsDescription: "Additional details about the signup rate limit error",
  detailsExample: "Rate limit exceeded for registration attempts",
});

const signupRequestSchema = zObject({
  confirmPassword: zString().min(1, "Please confirm your password").meta({
    description: "Password confirmation (must match password)",
    example: "SecurePassword123",
  }),
  email: zEmail().meta({
    description: "User's email address",
    example: "user@example.com",
  }),
  password: passwordValidationSchema.meta({
    description:
      "User's password (must be 8-50 chars with uppercase, lowercase, and number)",
    example: "SecurePassword123",
  }),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .meta({
    description: "Request body for user registration",
  });

const signupSuccessSchema = zObject({
  identity_id: zString().nullable().optional().meta({
    description: "Unique identifier for the user identity",
    example: "12345678-1234-1234-1234-123456789abc",
  }),
  status: zEnum(["complete", "verificationRequired"]).meta({
    description:
      "Signup status - complete if no verification needed, verificationRequired if email verification is needed",
    example: "complete",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the signup was completed",
    example: "2024-01-01T00:00:00Z",
  }),
  verifier: zString().optional().meta({
    description:
      "PKCE verifier for email verification (only present when status is verificationRequired)",
  }),
}).meta({
  description: "Successful signup response",
});

export {
  signupErrorSchema,
  signupRateLimitErrorSchema,
  signupRequestSchema,
  signupSuccessSchema,
};
