import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";
import { createClient } from "gel";

import type {
  HealthDatabaseListData,
  HealthDatabaseListError,
} from "@shared/types/generated/api-health.type";

import { API_HEALTH_ENDPOINTS } from "../../../../shared/constants/api.constant.ts";
import { GEL_DSN } from "../../../../shared/constants/root-env.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../../../shared/helpers/id-utils.helper.ts";
import {
  databaseHealthErrorSchema,
  databaseHealthSuccessSchema,
  databaseRateLimitErrorSchema,
} from "../../../../shared/schemas/api-health/database-route.schema.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { HEALTH_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { PinoLogHelper } from "../../../helpers/pino-log.helper.ts";

const databaseRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { getCurrentISOTimestamp } = DateHelper;
  const { fastIdGen } = IdUtilsHelper;
  const { log } = PinoLogHelper;

  const { MANY_REQUESTS_ERROR, OK, SERVICE_UNAVAILABLE } = HTTP_STATUS;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    `/${API_HEALTH_ENDPOINTS.DATABASE}`,
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
    async (_request, reply) => {
      const requestId = fastIdGen();

      try {
        const client = createClient({
          dsn: GEL_DSN,
        });

        let queryResult: unknown;

        try {
          queryResult = await client.query("SELECT 1 + 1");
        } finally {
          await client.close();
        }

        const response: HealthDatabaseListData = {
          database: "gel",
          dsn:
            typeof GEL_DSN === "string"
              ? GEL_DSN.replace(/\/\/.*@/, "//***@")
              : GEL_DSN,
          test_result: queryResult,
          timestamp: getCurrentISOTimestamp(),
        };

        return reply.status(OK).send(response);
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

        return reply.status(SERVICE_UNAVAILABLE).send(errorResponse);
      }
    }
  );
};

export { databaseRoute };
