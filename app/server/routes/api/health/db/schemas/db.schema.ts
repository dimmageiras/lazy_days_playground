import { zIsoDateTime, zObject, zString } from "@shared/wrappers/zod.wrapper";

const dbHealthResponseSchema = zObject({
  branch: zString().meta({
    description: "Database branch the server is connected to",
    example: "main",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO 8601 timestamp of when the check ran",
    example: "2026-07-06T00:00:00.000Z",
  }),
}).meta({
  description: "Database health check response",
});

export { dbHealthResponseSchema };
