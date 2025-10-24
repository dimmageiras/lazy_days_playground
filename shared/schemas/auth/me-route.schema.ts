import { zIsoDateTime, zObject, zString } from "../../wrappers/zod.wrapper.ts";

const meSuccessSchema = zObject({
  identity_id: zString().nullable().meta({
    description: "Unique identifier for the authenticated user",
    example: "12345678-1234-1234-1234-123456789abc",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the request was processed",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful authentication check response",
});

const meErrorSchema = zObject({
  details: zString().meta({
    description: "Additional error details",
    example: "No authentication token provided",
  }),
  error: zString().meta({
    description: "Error message",
    example: "Authentication required",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Authentication error response",
});

export { meErrorSchema, meSuccessSchema };
