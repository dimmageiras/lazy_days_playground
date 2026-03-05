import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";
import { zIsoDateTime, zObject, zString } from "../../wrappers/zod.wrapper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

const csrfTokenSuccessSchema = zObject({
  csrfToken: zString().meta({
    description: "The generated CSRF token to include in mutating request headers",
    example: "a1b2c3d4e5f6",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the token was generated",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful CSRF token generation response",
});

const csrfTokenRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription:
    "Additional details about the CSRF token rate limit error",
  detailsExample: "Rate limit exceeded for CSRF token generation",
});

/**
 * Response body when CSRF validation fails on a mutating request (POST, PUT, PATCH, DELETE).
 * Returned by the global CSRF hook in server/inits/security/security.init.ts — not by a single route.
 * Matches the standard error shape: error, optional details, timestamp.
 */
const csrfTokenMismatchErrorSchema = zObject({
  details: zString().optional().meta({
    description: "Additional error details",
    example: "Missing or invalid x-csrf-token header",
  }),
  error: zString().meta({
    description: "Error message",
    example: "CSRF Token Mismatch",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description:
    "CSRF token mismatch (missing, invalid, or expired token in x-csrf-token header)",
});

export {
  csrfTokenMismatchErrorSchema,
  csrfTokenRateLimitErrorSchema,
  csrfTokenSuccessSchema,
};
