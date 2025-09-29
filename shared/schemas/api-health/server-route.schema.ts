import { zIsoDateTime, zObject, zString } from "../../wrappers/zod.wrapper.ts";

const serverHealthSuccessSchema = zObject({
  service: zString().meta({
    description: "The name of the service being checked",
    example: "lazy_days_playground",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the health check was performed",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful server health check response",
});

const serverHealthErrorSchema = zObject({
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Internal server error",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when server health check fails",
});

export { serverHealthSuccessSchema, serverHealthErrorSchema };
