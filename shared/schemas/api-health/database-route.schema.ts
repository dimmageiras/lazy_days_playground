import {
  zIsoDateTime,
  zObject,
  zString,
  zUnknown,
} from "../../wrappers/zod.wrapper.ts";

const databaseHealthSuccessSchema = zObject({
  database: zString().meta({
    description: "Database type/name",
    example: "gel",
  }),
  dsn: zString().meta({
    description: "Database connection string (credentials masked)",
    example: "gel://***@host.docker.internal:5656/main?tls_security=insecure",
  }),
  test_result: zUnknown().meta({
    description: "Result of the database test query",
    example: [{ "1 + 1": 2 }],
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the database check was performed",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful database connectivity check response",
});

const databaseHealthErrorSchema = zObject({
  details: zString().optional().meta({
    description:
      "Additional error details (only present for connection errors)",
    example: "Connection timeout after 5000ms",
  }),
  error: zString().meta({
    description: "Error message describing the database connectivity issue",
    example: "Database connection failed",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when database connectivity check fails",
});

export { databaseHealthSuccessSchema, databaseHealthErrorSchema };
