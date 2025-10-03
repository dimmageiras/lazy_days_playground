import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";
import { zIsoDateTime, zObject, zString } from "../../wrappers/zod.wrapper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

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

const serverRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription:
    "Additional details about the server health rate limit error",
  detailsExample: "Rate limit exceeded for server health checks",
});

export { serverHealthSuccessSchema, serverRateLimitErrorSchema };
