import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";
import {
  zBoolean,
  zIsoDateTime,
  zNumber,
  zObject,
  zString,
} from "../../wrappers/zod.wrapper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

/**
 * CSP Reports Clear Success Schema
 * Response sent when all CSP reports are successfully deleted
 */
const cspClearSuccessSchema = zObject({
  success: zBoolean().meta({
    description: "Indicates successful deletion of all CSP reports",
    example: true,
  }),
  count: zNumber().meta({
    description: "Number of CSP reports that were deleted",
    example: 42,
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the reports were cleared",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful CSP reports clear response",
});

/**
 * CSP Reports Clear Error Schema
 * Response sent when there's an error clearing the CSP reports
 */
const cspClearErrorSchema = zObject({
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Failed to clear CSP reports",
  }),
  details: zString().optional().meta({
    description: "Additional error details",
    example: "Database connection error",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when CSP reports clear fails",
});

/**
 * CSP Reports Clear Rate Limit Error Schema
 * Response sent when rate limit is exceeded for CSP reports clear requests
 */
const cspClearRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription:
    "Additional details about why the CSP reports clear rate limit was triggered",
  detailsExample: "Too many clear requests submitted in a short time period",
});

export {
  cspClearErrorSchema,
  cspClearRateLimitErrorSchema,
  cspClearSuccessSchema,
};
