import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";
import { zIsoDateTime, zObject, zString } from "../../wrappers/zod.wrapper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

const logoutErrorSchema = zObject({
  details: zString().optional().meta({
    description: "Additional error details (only present for caught errors)",
    example: "Invalid authentication token",
  }),
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Logout failed",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when logout fails",
});

const logoutRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription: "Additional details about the logout rate limit error",
  detailsExample: "Rate limit exceeded for logout attempts",
});

const logoutRequestSchema = zObject({
  cookieName: zString().min(1).meta({
    description:
      "Name of the custom cookie to be deleted (ACCESS_TOKEN is always deleted, plus this specified cookie)",
    example: "client-id",
  }),
}).meta({
  description:
    "Request body for user logout - ACCESS_TOKEN cookie is always deleted plus the specified custom cookie",
});

const logoutSuccessSchema = zObject({
  message: zString().meta({
    description: "Success message",
    example: "Logout successful",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the logout was completed",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful logout response",
});

export {
  logoutErrorSchema,
  logoutRateLimitErrorSchema,
  logoutRequestSchema,
  logoutSuccessSchema,
};
