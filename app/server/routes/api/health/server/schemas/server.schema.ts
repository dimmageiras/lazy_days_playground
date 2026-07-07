import { zIsoDateTime, zObject, zString } from "@shared/wrappers/zod.wrapper";

const serverHealthResponseSchema = zObject({
  service: zString().meta({
    description: "Name of the service reporting its health",
    example: "lazy_days_playground",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO 8601 timestamp of when the check ran",
    example: "2026-07-06T00:00:00.000Z",
  }),
}).meta({
  description: "Server health check response",
});

export { serverHealthResponseSchema };
