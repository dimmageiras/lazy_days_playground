import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";
import { createClient as createGelClient } from "gel";

import type {
  HealthDatabaseListData,
  HealthDatabaseListError,
} from "@shared/types/generated/server/api-health.type";

import { API_HEALTH_ENDPOINTS } from "../../../../../shared/constants/api.constant.ts";
import { GEL_DSN } from "../../../../../shared/constants/root-env.constant.ts";
import {
  databaseHealthErrorSchema,
  databaseHealthSuccessSchema,
  databaseRateLimitErrorSchema,
} from "../../../../../shared/schemas/api-health/database-route.schema.ts";
import { HTTP_STATUS } from "../../../../constants/http-status.constant.ts";
import { HEALTH_RATE_LIMIT } from "../../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../../helpers/routes.helper.ts";

const databaseRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { DATABASE } = API_HEALTH_ENDPOINTS;
  const { MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } = HTTP_STATUS;

  const { fastIdGen, getCurrentISOTimestamp, log } = RoutesHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    `/${DATABASE}`,
    {
      config: {
        rateLimit: HEALTH_RATE_LIMIT,
      },
      schema: {
        description:
          "Verifies Gel database connectivity and returns connection status",
        summary: "Check database connectivity",
        tags: ["API Health"],
        response: {
          [OK]: {
            content: {
              "application/json": { schema: databaseHealthSuccessSchema },
            },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: databaseRateLimitErrorSchema },
            },
          },
          [SERVICE_UNAVAILABLE]: {
            content: {
              "application/json": { schema: databaseHealthErrorSchema },
            },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (_request, response) => {
      const requestId = fastIdGen();

      try {
        const client = createGelClient({
          dsn: GEL_DSN,
        });

        let queryResult: unknown;

        try {
          queryResult = await client.query("SELECT 1 + 1");
        } finally {
          await client.close();
        }

        const dbResponse: HealthDatabaseListData = {
          database: "gel",
          dsn:
            typeof GEL_DSN === "string"
              ? GEL_DSN.replace(/\/\/.*@/, "//***@")
              : GEL_DSN,
          test_result: queryResult,
          timestamp: getCurrentISOTimestamp(),
        };

        return response.status(OK).send(dbResponse);
      } catch (error) {
        log.error(
          {
            dsn:
              typeof GEL_DSN === "string"
                ? GEL_DSN.replace(/\/\/.*@/, "//***@")
                : "undefined",
            error: error instanceof Error ? error.message : "Unknown error",
            requestId,
            stack: error instanceof Error ? error.stack : undefined,
          },
          "💥 Database health check failed with error"
        );

        const errorResponse: HealthDatabaseListError = {
          details: "An unexpected error occurred. Please try again later.",
          error: "Database connection failed",
          timestamp: getCurrentISOTimestamp(),
        };

        return response.status(SERVICE_UNAVAILABLE).send(errorResponse);
      }
    }
  );
};

export { databaseRoute };
