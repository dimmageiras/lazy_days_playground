import type { ZodObject } from "../../shared/wrappers/zod.wrapper.ts";
import {
  zLiteral,
  zNumber,
  zObject,
  zString,
} from "../../shared/wrappers/zod.wrapper.ts";
import { HTTP_STATUS } from "../constants/http-status.constant.ts";

const createBaseRateLimitError = ({
  detailsDescription = "Additional rate limit details",
  detailsExample = "Rate limit exceeded",
}: {
  detailsDescription?: string;
  detailsExample?: string;
}): ZodObject => {
  const { MANY_REQUESTS_ERROR } = HTTP_STATUS;

  return zObject({
    error: zString().meta({
      description: "Error type",
      example: "Too Many Requests",
    }),
    message: zString().meta({
      description: "Human-readable message",
      example: "Rate limit exceeded. Try again in 30 seconds.",
    }),
    retryAfter: zNumber()
      .int()
      .positive()
      .meta({ description: "Seconds until retry", example: 30 }),
    statusCode: zLiteral(MANY_REQUESTS_ERROR).meta({
      description: "HTTP status code",
      example: MANY_REQUESTS_ERROR,
    }),
    details: zString().optional().meta({
      description: detailsDescription,
      example: detailsExample,
    }),
  }).meta({
    description: "Base error response when rate limit is exceeded",
  });
};

export const ZodSchemaHelper = {
  createBaseRateLimitError,
};
