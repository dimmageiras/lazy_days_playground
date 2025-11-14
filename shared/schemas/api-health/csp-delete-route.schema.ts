import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";
import {
  zBoolean,
  zIsoDateTime,
  zObject,
  zString,
} from "../../wrappers/zod.wrapper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

/**
 * CSP Report Delete Request Schema
 * Request parameters for deleting a specific CSP report by ID
 */
const cspDeleteRequestSchema = zObject({
  id: zString().meta({
    description: "Unique identifier of the CSP report to delete",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  }),
}).meta({
  description: "CSP report deletion request parameters",
});

/**
 * CSP Report Delete Success Schema
 * Response sent when a CSP report is successfully deleted
 */
const cspDeleteSuccessSchema = zObject({
  success: zBoolean().meta({
    description: "Indicates successful deletion of the CSP report",
    example: true,
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the report was deleted",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful CSP report deletion response",
});

/**
 * CSP Report Delete Error Schema
 * Response sent when there's an error deleting the CSP report
 */
const cspDeleteErrorSchema = zObject({
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Failed to delete CSP report",
  }),
  details: zString().optional().meta({
    description: "Additional error details",
    example: "Report not found",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when CSP report deletion fails",
});

/**
 * CSP Report Delete Rate Limit Error Schema
 * Response sent when rate limit is exceeded for CSP report deletion requests
 */
const cspDeleteRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription:
    "Additional details about why the CSP report deletion rate limit was triggered",
  detailsExample: "Too many deletion requests submitted in a short time period",
});

export {
  cspDeleteErrorSchema,
  cspDeleteRateLimitErrorSchema,
  cspDeleteRequestSchema,
  cspDeleteSuccessSchema,
};
