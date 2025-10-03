import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";
import {
  zBoolean,
  zEmail,
  zIsoDateTime,
  zObject,
  zString,
} from "../../wrappers/zod.wrapper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

const checkEmailErrorSchema = zObject({
  details: zString().optional().meta({
    description: "Additional error details (only present for caught errors)",
    example: "Database connection timeout",
  }),
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Failed to check email availability",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when email check fails",
});

const checkEmailRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription:
    "Additional details about the check-email rate limit error",
  detailsExample: "Rate limit exceeded for email existence checks",
});

const checkEmailRequestSchema = zObject({
  email: zEmail().meta({
    description: "Email address to check for availability",
    example: "user@example.com",
  }),
}).meta({
  description: "Request body for checking email availability",
});

const checkEmailSuccessSchema = zObject({
  details: zString().optional().meta({
    description: "Additional details about the email check result",
    example: "Email is available for registration",
  }),
  email: zEmail().meta({
    description: "The email address that was checked",
    example: "user@example.com",
  }),
  exists: zBoolean().meta({
    description: "Whether the email already exists in the system",
    example: false,
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the email check was performed",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful email availability check response",
});

export {
  checkEmailErrorSchema,
  checkEmailRateLimitErrorSchema,
  checkEmailRequestSchema,
  checkEmailSuccessSchema,
};
