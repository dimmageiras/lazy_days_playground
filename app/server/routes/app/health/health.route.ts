import type { FastifyPluginAsync } from "fastify";

import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";

import { DateHelper } from "@shared/helpers/date.helper";

const { SERVER } = API_HEALTH_ENDPOINTS;

const { getCurrentTimestamp } = DateHelper;

const healthRoutes: FastifyPluginAsync = async (instance) => {
  const serverHealthCheckRoute = () => ({
    service: instance.appEnv.serviceName,
    timestamp: getCurrentTimestamp(),
  });

  instance.get(`/${SERVER}`, serverHealthCheckRoute);
};

export { healthRoutes };
