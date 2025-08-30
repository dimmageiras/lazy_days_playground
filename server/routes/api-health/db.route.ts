import type { FastifyInstance } from "fastify";
import type { Logger } from "pino";

import { API_HEALTH_STATUSES } from "../../../shared/constants/api-health.constant.ts";
import type {
  ApiHealthDbConnectionErrorResponse,
  ApiHealthDbDsnErrorResponse,
  ApiHealthDbSuccessResponse,
} from "../../../shared/types/api-health.type.ts";
import { HTTP_STATUS } from "../../constants/http-status.constant.ts";

/**
 * Database health check endpoint - verifies Gel database connectivity
 *
 * @param {FastifyInstance} fastify - Fastify instance to register routes on
 * @param {Logger} log - Pino logger instance for structured logging
 * @route GET /api/health/db
 * @requires VITE_APP_GEL_DSN environment variable
 * @returns {Promise<void>} Returns 200 with DB status or 500 on failure
 *
 * @example Success: { "database": "gel", "status": "healthy", "test_result": [...], ... }
 * @example Error: { "error": "Database connection failed", "status": "unhealthy", ... }
 */
const dbRoute = async (
  fastify: FastifyInstance,
  log: Logger
): Promise<void> => {
  fastify.get("db", async (request, reply) => {
    const requestId = request.id;
    const startTime = Date.now();

    try {
      const { createClient } = await import("gel");

      const gelDSN = process.env.VITE_APP_GEL_DSN;

      if (!gelDSN) {
        const duration = Date.now() - startTime;

        log.error({
          duration,
          endpoint: "/api/health/db",
          msg: "Database health check failed - DSN not configured",
          requestId,
        });

        const errorResponse: ApiHealthDbDsnErrorResponse = {
          error: "Database DSN not configured",
          status: API_HEALTH_STATUSES.UNHEALTHY,
          timestamp: new Date().toISOString(),
        };

        return reply
          .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
          .send(errorResponse);
      }

      const client = createClient({
        dsn: gelDSN,
      });

      try {
        const result = await client.query("SELECT 1 + 1");

        await client.close();

        const duration = Date.now() - startTime;
        const response: ApiHealthDbSuccessResponse = {
          database: "gel",
          dsn:
            typeof gelDSN === "string"
              ? gelDSN.replace(/\/\/.*@/, "//***@")
              : gelDSN,
          status: API_HEALTH_STATUSES.HEALTHY,
          test_result: result,
          timestamp: new Date().toISOString(),
        };

        log.debug({
          database: "gel",
          duration,
          endpoint: "/api/health/db",
          msg: "Database health check successful",
          requestId,
        });

        return reply.status(HTTP_STATUS.OK).send(response);
      } catch (dbError) {
        await client.close();

        throw dbError;
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error({
        database: "gel",
        duration,
        endpoint: "/api/health/db",
        error: error instanceof Error ? error.message : error,
        msg: "Database health check failed",
        requestId,
      });

      const errorResponse: ApiHealthDbConnectionErrorResponse = {
        details: error instanceof Error ? error.message : "Unknown error",
        error: "Database connection failed",
        status: API_HEALTH_STATUSES.UNHEALTHY,
        timestamp: new Date().toISOString(),
      };

      return reply
        .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
        .send(errorResponse);
    }
  });
};

export { dbRoute };
