import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";
import type { FastifyPluginAsync } from "fastify";

import { DateHelper } from "@shared/helpers/date.helper";

const { SERVER } = API_HEALTH_ENDPOINTS;

const { getCurrentTimestamp } = DateHelper;

const healthRoutes: FastifyPluginAsync = async (instance) => {
  const { appEnv } = instance;

  instance.get(`/${SERVER}`, () => ({
    service: appEnv.serviceName,
    timestamp: getCurrentTimestamp(),
  }));
};

export { healthRoutes };
