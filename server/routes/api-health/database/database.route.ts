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
} from "../../../../shared/schemas/api-health/database-route.schema.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { PinoLogHelper } from "../../../helpers/pino-log.helper.ts";

const databaseRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { getCurrentISOTimestamp } = DateHelper;
  const { fastIdGen } = IdUtilsHelper;
  const { log } = PinoLogHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    `/${API_HEALTH_ENDPOINTS.DATABASE}`,
    {
      schema: {
        description:
          "Verifies Gel database connectivity and returns connection status",
        summary: "Check database connectivity",
        tags: ["API Health"],
        response: {
          200: {
            content: {
              "application/json": {
                schema: databaseHealthSuccessSchema,
              },
            },
          },
          503: {
            content: {
              "application/json": {
                schema: databaseHealthErrorSchema,
              },
            },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (_request, reply) => {
      const requestId = fastIdGen();

      try {
        const gelDSN = GEL_DSN;

        if (!gelDSN) {
          log.warn(
            {
              issue: "missing_dsn",
              requestId,
            },
            "⚠️ Database health check failed - DSN not configured"
          );

          const errorResponse: HealthDatabaseListError = {
            error: "Database DSN not configured",
            timestamp: getCurrentISOTimestamp(),
          };

          return reply
            .status(HTTP_STATUS.SERVICE_UNAVAILABLE)
            .send(errorResponse);
        }

        const client = createClient({
          dsn: gelDSN,
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
            typeof gelDSN === "string"
              ? gelDSN.replace(/\/\/.*@/, "//***@")
              : gelDSN,
          test_result: queryResult,
          timestamp: getCurrentISOTimestamp(),
        };

        return reply.status(HTTP_STATUS.OK).send(response);
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
          details: error instanceof Error ? error.message : "Unknown error",
          error: "Database connection failed",
          timestamp: getCurrentISOTimestamp(),
        };

        return reply
          .status(HTTP_STATUS.SERVICE_UNAVAILABLE)
          .send(errorResponse);
      }
    }
  );
};

export { databaseRoute };
