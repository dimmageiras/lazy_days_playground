import { z } from "zod";

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
 * CSP Report List Success Schema
 * Response containing an array of CSP violation reports from the database
 */
const cspListSuccessSchema = zObject({
  success: zBoolean().meta({
    description: "Indicates successful retrieval of CSP reports",
    example: true,
  }),
  data: z
    .array(
      zObject({
        id: zString().meta({
          description: "Unique identifier for the CSP report",
          example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        }),
        blocked_uri: zString().meta({
          description: "The URI of the resource that was blocked from loading",
          example: "https://evil.example.com/malicious.js",
        }),
        column_number: zNumber().nullish().meta({
          description:
            "The column number in the source file where the violation occurred",
          example: 15,
        }),
        created_at: zIsoDateTime().meta({
          description: "Timestamp when the report was created",
          example: "2024-01-01T00:00:00Z",
        }),
        disposition: zString().nullish().meta({
          description:
            "Whether the user agent enforced or only reported the policy",
          example: "enforce",
        }),
        document_uri: zString().meta({
          description: "The URI of the document where the violation occurred",
          example: "https://example.com/page",
        }),
        effective_directive: zString().meta({
          description: "The directive whose enforcement caused the violation",
          example: "script-src",
        }),
        ip_address: zString().nullish().meta({
          description: "IP address of the client that triggered the violation",
          example: "192.168.1.1",
        }),
        line_number: zNumber().nullish().meta({
          description:
            "The line number in the source file where the violation occurred",
          example: 42,
        }),
        original_policy: zString().meta({
          description:
            "The original policy as specified by the Content-Security-Policy header",
          example: "default-src 'self'; script-src 'self'",
        }),
        referrer: zString().meta({
          description:
            "The referrer of the document where the violation occurred",
          example: "https://example.com/",
        }),
        source_file: zString().nullish().meta({
          description: "The URL of the resource where the violation occurred",
          example: "https://example.com/script.js",
        }),
        status_code: zNumber().meta({
          description:
            "The HTTP status code of the resource on which the violation occurred",
          example: 200,
        }),
        user_agent: zString().nullish().meta({
          description: "User agent string of the client",
          example: "Mozilla/5.0...",
        }),
      })
    )
    .meta({
      description: "Array of CSP violation reports",
    }),
  count: zNumber().meta({
    description: "Total number of reports returned",
    example: 10,
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp when the reports were retrieved",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Successful CSP report list retrieval response",
});

/**
 * CSP Report List Error Schema
 * Response sent when there's an error retrieving the CSP reports
 */
const cspListErrorSchema = zObject({
  error: zString().meta({
    description: "Error message describing what went wrong",
    example: "Failed to retrieve CSP reports",
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
  description: "Error response when CSP report list retrieval fails",
});

/**
 * CSP Report List Rate Limit Error Schema
 * Response sent when rate limit is exceeded for CSP report list requests
 */
const cspListRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription:
    "Additional details about why the CSP report list rate limit was triggered",
  detailsExample:
    "Too many requests to retrieve CSP reports in a short time period",
});

export {
  cspListErrorSchema,
  cspListRateLimitErrorSchema,
  cspListSuccessSchema,
};
