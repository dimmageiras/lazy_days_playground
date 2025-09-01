import type { FastifyInstance } from "fastify";
import { createClient } from "gel";
import type { Logger } from "pino";

import {
  API_HEALTH_ENDPOINTS,
  API_HEALTH_STATUSES,
} from "../../../shared/constants/api-health.constant.ts";
import { API_HEALTH_BASE_URL } from "../../../shared/constants/base-urls.const.ts";
import { GEL_DSN } from "../../../shared/constants/root-env.constant.ts";
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
 * @route GET /api/health/database
 * @requires VITE_APP_GEL_DSN environment variable
 * @returns {Promise<void>} Returns 200 with DB status or 500 on failure
 *
 * @example Success: { "database": "gel", "status": "healthy", "test_result": [...], ... }
 * @example Error: { "error": "Database connection failed", "status": "unhealthy", ... }
 *
 * @note This route is registered with prefix ${API_HEALTH_BASE_URL} in server/start.ts
 */
const databaseRoute = async (
  fastify: FastifyInstance,
  log: Logger
): Promise<void> => {
  fastify.get(`/${API_HEALTH_ENDPOINTS.DATABASE}`, async (request, reply) => {
    const requestId = request.id;
    const startTime = Date.now();

    try {
      const gelDSN = GEL_DSN;

      if (!gelDSN) {
        const duration = Date.now() - startTime;

        log.error({
          duration,
          endpoint: `${API_HEALTH_BASE_URL}/${API_HEALTH_ENDPOINTS.DATABASE}`,
          msg: "Database health check failed - DSN not configured",
          requestId,
        });

        const errorResponse: ApiHealthDbDsnErrorResponse = {
          error: "Database DSN not configured",
          status: API_HEALTH_STATUSES.UNHEALTHY,
          timestamp: new Date().toISOString(),
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

      const duration = Date.now() - startTime;
      const response: ApiHealthDbSuccessResponse = {
        database: "gel",
        dsn:
          typeof gelDSN === "string"
            ? gelDSN.replace(/\/\/.*@/, "//***@")
            : gelDSN,
        status: API_HEALTH_STATUSES.HEALTHY,
        test_result: queryResult,
        timestamp: new Date().toISOString(),
      };

      log.info({
        database: "gel",
        duration,
        endpoint: `${API_HEALTH_BASE_URL}/${API_HEALTH_ENDPOINTS.DATABASE}`,
        msg: "Database health check successful",
        requestId,
      });

      return reply.status(HTTP_STATUS.OK).send(response);
    } catch (error) {
      const duration = Date.now() - startTime;

      log.error({
        database: "gel",
        duration,
        endpoint: `${API_HEALTH_BASE_URL}/${API_HEALTH_ENDPOINTS.DATABASE}`,
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

      return reply.status(HTTP_STATUS.SERVICE_UNAVAILABLE).send(errorResponse);
    }
  });
};

export { databaseRoute };
