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
 * CSP Report Request Schema
 * Represents the structure of a Content Security Policy violation report
 * sent by the browser when a CSP policy is violated.
 *
 * Based on the CSP Level 3 specification:
 * https://www.w3.org/TR/CSP3/#violation-report
 */
const cspReportRequestSchema = zObject({
  "csp-report": zObject({
    "blocked-uri": zString().meta({
      description: "The URI of the resource that was blocked from loading",
      example: "https://evil.example.com/malicious.js",
    }),
    "column-number": zNumber().nullish().meta({
      description:
        "The column number in the source file where the violation occurred",
      example: 15,
    }),
    disposition: zString().nullish().meta({
      description:
        "Whether the user agent enforced or only reported the policy",
      example: "enforce",
    }),
    "document-uri": zString().meta({
      description: "The URI of the document where the violation occurred",
      example: "https://example.com/page",
    }),
    "effective-directive": zString().meta({
      description: "The directive whose enforcement caused the violation",
      example: "script-src",
    }),
    "line-number": zNumber().nullish().meta({
      description:
        "The line number in the source file where the violation occurred",
      example: 42,
    }),
    "original-policy": zString().meta({
      description:
        "The original policy as specified by the Content-Security-Policy header",
      example: "default-src 'self'; script-src 'self'",
    }),
    referrer: zString().meta({
      description: "The referrer of the document where the violation occurred",
      example: "https://example.com/",
    }),
    "source-file": zString().nullish().meta({
      description: "The URL of the resource where the violation occurred",
      example: "https://example.com/script.js",
    }),
    "status-code": zNumber().meta({
      description:
        "The HTTP status code of the resource on which the violation occurred",
      example: 200,
    }),
    "violated-directive": zString().nullish().meta({
      description:
        "The directive whose enforcement caused the violation (deprecated, use effective-directive)",
      example: "script-src 'self'",
    }),
  }).meta({
    description: "Content Security Policy violation report",
  }),
}).meta({
  description: "CSP violation report request body",
});

/**
 * CSP Report Success Schema
 * Response sent when a CSP report is successfully received and logged
 */
const cspReportSuccessSchema = zObject({
  success: zBoolean().meta({
    description: "Indicates successful receipt of the CSP report",
    example: true,
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the report was received",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful CSP report submission response",
});

/**
 * CSP Report Error Schema
 * Response sent when there's an error processing the CSP report
 */
const cspReportErrorSchema = zObject({
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Failed to process CSP report",
  }),
  details: zString().optional().meta({
    description: "Additional error details",
    example: "Invalid report format",
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the error occurred",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response when CSP report processing fails",
});

/**
 * CSP Report Rate Limit Error Schema
 * Response sent when rate limit is exceeded for CSP report submissions
 */
const cspReportRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription:
    "Additional details about why the CSP report rate limit was triggered",
  detailsExample:
    "Too many CSP violation reports submitted in a short time period",
});

export {
  cspReportErrorSchema,
  cspReportRateLimitErrorSchema,
  cspReportRequestSchema,
  cspReportSuccessSchema,
};
