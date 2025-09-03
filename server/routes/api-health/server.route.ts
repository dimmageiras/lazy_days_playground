import type { FastifyInstance } from "fastify";

import { API_HEALTH_ENDPOINTS } from "../../../shared/constants/api.constant.ts";
import type { ApiHealthServerSuccessResponse } from "../../../shared/types/api-health.type.ts";
import { HTTP_STATUS } from "../../constants/http-status.constant.ts";

/**
 * Server health check endpoint for load balancers and monitoring systems
 *
 * @param {FastifyInstance} fastify - Fastify instance to register routes on
 * @route GET /api/health/server
 * @returns {Promise<void>} Returns 200 with service status or 500 on failure
 *
 * @example Success: { "service": "lazy_days_playground", "status": "healthy", "timestamp": "..." }
 * @example Error: { "error": "Server health check failed", "status": "unhealthy", "timestamp": "..." }
 *
 * @note This route is registered with prefix ${API_HEALTH_BASE_URL} in server/start.ts
 */
const serverRoute = async (fastify: FastifyInstance): Promise<void> => {
  fastify.get(`/${API_HEALTH_ENDPOINTS.SERVER}`, async (_request, reply) => {
    const response: ApiHealthServerSuccessResponse = {
      service: "lazy_days_playground",
      timestamp: new Date().toISOString(),
    };

    return reply.status(HTTP_STATUS.OK).send(response);
  });
};

export { serverRoute };
