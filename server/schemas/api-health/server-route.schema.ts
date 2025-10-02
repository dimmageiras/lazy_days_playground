import {
  zIsoDateTime,
  zObject,
  zString,
} from "../../../shared/wrappers/zod.wrapper.ts";
import { createBaseRateLimitErrorSchema } from "../common/base-rate-limit-error.schema.ts";

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

const serverRateLimitErrorSchema = createBaseRateLimitErrorSchema({
  detailsDescription:
    "Additional details about the server health rate limit error",
  detailsExample: "Rate limit exceeded for server health checks",
});

export { serverHealthSuccessSchema, serverRateLimitErrorSchema };
