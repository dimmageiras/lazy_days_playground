import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";
import { SERVICE } from "@server/constants/service.constant";
import type { FastifyPluginAsync } from "fastify";

import { DateHelper } from "@shared/helpers/date.helper";

const { SERVER } = API_HEALTH_ENDPOINTS;
const { NAME } = SERVICE;

const { getCurrentTimestamp } = DateHelper;

const serverHealthCheckRoute = () => ({
  service: NAME,
  timestamp: getCurrentTimestamp(),
});

const healthRoutes: FastifyPluginAsync = async (instance) => {
  instance.get(`/${SERVER}`, serverHealthCheckRoute);
};

export { healthRoutes };
