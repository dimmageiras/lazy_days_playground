import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";
import {
  zEmail,
  zIsoDateTime,
  zObject,
  zString,
} from "../../wrappers/zod.wrapper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

const signinErrorSchema = zObject({
  details: zString().optional().meta({
    description: "Additional error details (only present for caught errors)",
    example: "Invalid credentials provided",
  }),
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Authentication failed",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when sign in fails",
});

const signinRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription: "Additional details about the signin rate limit error",
  detailsExample: "Rate limit exceeded for authentication attempts",
});

const signinRequestSchema = zObject({
  email: zEmail().meta({
    description: "User's email address",
    example: "user@example.com",
  }),
  password: zString().min(1).meta({
    description: "User's password",
    example: "SecurePassword123",
  }),
}).meta({
  description: "Request body for user sign in",
});

const signinSuccessSchema = zObject({
  identity_id: zString().nullable().meta({
    description: "Unique identifier for the user identity",
    example: "12345678-1234-1234-1234-123456789abc",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the sign in was completed",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful sign in response",
});

export {
  signinErrorSchema,
  signinRateLimitErrorSchema,
  signinRequestSchema,
  signinSuccessSchema,
};
