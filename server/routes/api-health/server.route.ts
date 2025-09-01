import type { FastifyInstance } from "fastify";
import type { Logger } from "pino";

import {
  API_HEALTH_ENDPOINTS,
  API_HEALTH_STATUSES,
} from "../../../shared/constants/api-health.constant.ts";
import { API_HEALTH_BASE_URL } from "../../../shared/constants/base-urls.const.ts";
import type { ApiHealthServerSuccessResponse } from "../../../shared/types/api-health.type.ts";
import { HTTP_STATUS } from "../../constants/http-status.constant.ts";

/**
 * Server health check endpoint for load balancers and monitoring systems
 *
 * @param {FastifyInstance} fastify - Fastify instance to register routes on
 * @param {Logger} log - Pino logger instance for structured logging
 * @route GET /api/health/server
 * @returns {Promise<void>} Returns 200 with service status or 500 on failure
 *
 * @example Success: { "service": "lazy_days_playground", "status": "healthy", "timestamp": "..." }
 * @example Error: { "error": "Server health check failed", "status": "unhealthy", "timestamp": "..." }
 *
 * @note This route is registered with prefix ${API_HEALTH_BASE_URL} in server/start.ts
 */
const serverRoute = async (
  fastify: FastifyInstance,
  log: Logger
): Promise<void> => {
  fastify.get(`/${API_HEALTH_ENDPOINTS.SERVER}`, async (request, reply) => {
    const requestId = request.id;
    const startTime = Date.now();

    const response: ApiHealthServerSuccessResponse = {
      service: "lazy_days_playground",
      status: API_HEALTH_STATUSES.HEALTHY,
      timestamp: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;

    log.info({
      duration,
      endpoint: `${API_HEALTH_BASE_URL}/${API_HEALTH_ENDPOINTS.SERVER}`,
      msg: "Server health check successful",
      requestId,
      service: response.service,
    });

    return reply.status(HTTP_STATUS.OK).send(response);
  });
};

export { serverRoute };
