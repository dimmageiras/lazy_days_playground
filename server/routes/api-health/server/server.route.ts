import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";

import type { HealthServerListResponse } from "@shared/types/api-health.type";

import { API_HEALTH_ENDPOINTS } from "../../../../shared/constants/api.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import {
  serverHealthErrorSchema,
  serverHealthSuccessSchema,
} from "../../../../shared/schemas/api-health/server-route.schema.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";

const serverRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { getCurrentISOTimestamp } = DateHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    `/${API_HEALTH_ENDPOINTS.SERVER}`,
    {
      schema: {
        description:
          "Returns the health status of the server for monitoring and load balancers",
        summary: "Check server health status",
        tags: ["API Health"],
        response: {
          200: {
            content: {
              "application/json": {
                schema: serverHealthSuccessSchema,
              },
            },
          },
          500: {
            content: {
              "application/json": {
                schema: serverHealthErrorSchema,
              },
            },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (_request, reply) => {
      const response: HealthServerListResponse = {
        service: "lazy_days_playground",
        timestamp: getCurrentISOTimestamp(),
      };

      return reply.status(HTTP_STATUS.OK).send(response);
    }
  );
};

export { serverRoute };
