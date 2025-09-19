import type { FastifyInstance } from "fastify";
import { createClient } from "gel";

import type {
  ApiHealthDatabaseConnectionErrorResponse,
  ApiHealthDatabaseDsnErrorResponse,
  ApiHealthDatabaseSuccessResponse,
} from "@shared/types/api-health.type";

import { API_HEALTH_ENDPOINTS } from "../../../../shared/constants/api.constant.ts";
import { GEL_DSN } from "../../../../shared/constants/root-env.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import { IdUtilsHelper } from "../../../../shared/helpers/id-utils.helper.ts";
import { databaseHealthSchema } from "../../../../shared/schemas/api-health/database-route.schema.ts";
import { zToJSONSchema } from "../../../../shared/wrappers/zod.wrapper.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { PinoLogHelper } from "../../../helpers/pino-log.helper.ts";

const databaseRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { getCurrentISOTimestamp } = DateHelper;
  const { fastIdGen } = IdUtilsHelper;
  const { log } = PinoLogHelper;

  const databaseHealthRouteSchema = {
    description:
      "Verifies Gel database connectivity and returns connection status",
    response: {
      200: zToJSONSchema(databaseHealthSchema),
      503: zToJSONSchema(databaseHealthSchema),
    },
    summary: "Check database connectivity",
    tags: ["Health"],
  } as const;

  fastify.get(
    `/${API_HEALTH_ENDPOINTS.DATABASE}`,
    { schema: databaseHealthRouteSchema },
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

          const errorResponse: ApiHealthDatabaseDsnErrorResponse = {
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

        const response: ApiHealthDatabaseSuccessResponse = {
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

        const errorResponse: ApiHealthDatabaseConnectionErrorResponse = {
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
