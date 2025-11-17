import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type { HealthServerListData } from "@shared/types/generated/server/api-health.type";

import { API_HEALTH_ENDPOINTS } from "../../../../../shared/constants/api.constant.ts";
import {
  serverHealthSuccessSchema,
  serverRateLimitErrorSchema,
} from "../../../../../shared/schemas/api-health/server-route.schema.ts";
import { HTTP_STATUS } from "../../../../constants/http-status.constant.ts";
import { HEALTH_RATE_LIMIT } from "../../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../../helpers/routes.helper.ts";

const serverRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { SERVER } = API_HEALTH_ENDPOINTS;
  const { MANY_REQUESTS_ERROR, OK } = HTTP_STATUS;

  const { getCurrentISOTimestamp } = RoutesHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    `/${SERVER}`,
    {
      config: {
        rateLimit: HEALTH_RATE_LIMIT,
      },
      schema: {
        description:
          "Returns the health status of the server for monitoring and load balancers",
        summary: "Check server health status",
        tags: ["API Health"],
        response: {
          [OK]: {
            content: {
              "application/json": { schema: serverHealthSuccessSchema },
            },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: serverRateLimitErrorSchema },
            },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (_request, response) => {
      const serverResponse: HealthServerListData = {
        service: "lazy_days_playground",
        timestamp: getCurrentISOTimestamp(),
      };

      return response.status(OK).send(serverResponse);
    }
  );
};

export { serverRoute };
