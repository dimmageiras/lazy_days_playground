import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";
import { zIsoDateTime, zObject, zString } from "../../wrappers/zod.wrapper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

const verifyErrorSchema = zObject({
  details: zString().optional().meta({
    description: "Additional error details (only present for caught errors)",
    example: "Invalid or expired verification token",
  }),
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Verification failed",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when email verification fails",
});

const verifyRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription: "Additional details about the verify rate limit error",
  detailsExample: "Rate limit exceeded for verification attempts",
});

const verifyRequestSchema = zObject({
  verificationToken: zString().meta({
    description: "Email verification token from the verification email",
    example: "abc123xyz789",
  }),
  verifier: zString().meta({
    description: "PKCE verifier stored in cookie during signup",
    example: "def456uvw012",
  }),
}).meta({
  description: "Request body for email verification",
});

const verifySuccessSchema = zObject({
  identity_id: zString().nullable().meta({
    description: "Unique identifier for the user identity",
    example: "12345678-1234-1234-1234-123456789abc",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the verification was completed",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful email verification response",
});

export {
  verifyErrorSchema,
  verifyRateLimitErrorSchema,
  verifyRequestSchema,
  verifySuccessSchema,
};
