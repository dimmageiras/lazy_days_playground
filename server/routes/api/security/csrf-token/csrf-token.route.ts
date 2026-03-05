import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import { API_SECURITY_ENDPOINTS } from "../../../../../shared/constants/api.constant.ts";
import {
  csrfTokenRateLimitErrorSchema,
  csrfTokenSuccessSchema,
} from "../../../../../shared/schemas/api-security/csrf-token-route.schema.ts";
import { HTTP_STATUS } from "../../../../constants/http-status.constant.ts";
import { HEALTH_RATE_LIMIT } from "../../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../../helpers/routes.helper.ts";

const csrfTokenRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { CSRF_TOKEN } = API_SECURITY_ENDPOINTS;
  const { MANY_REQUESTS_ERROR, OK } = HTTP_STATUS;

  const { getCurrentISOTimestamp } = RoutesHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    `/${CSRF_TOKEN}`,
    {
      config: {
        rateLimit: HEALTH_RATE_LIMIT,
      },
      schema: {
        description:
          "Generates a new CSRF token and sets the corresponding secret cookie. The returned token must be included in the x-csrf-token header for all mutating requests (POST, PUT, PATCH, DELETE).",
        summary: "Generate a new CSRF token",
        tags: ["API Security"],
        response: {
          [OK]: {
            content: {
              "application/json": { schema: csrfTokenSuccessSchema },
            },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: csrfTokenRateLimitErrorSchema },
            },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (_request, response) => {
      const csrfToken = response.generateCsrf();

      return response.status(OK).send({
        csrfToken,
        timestamp: getCurrentISOTimestamp(),
      });
    }
  );
};

export { csrfTokenRoute };
