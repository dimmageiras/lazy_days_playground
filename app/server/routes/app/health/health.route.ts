import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";
import type { FastifyPluginAsync } from "fastify";

import { APP_ENV } from "@shared/constants/app-env.constant";
import { DateHelper } from "@shared/helpers/date.helper";

const { SERVER } = API_HEALTH_ENDPOINTS;
const { APP_SERVICE_NAME } = APP_ENV;

const { getCurrentTimestamp } = DateHelper;

const serverHealthCheckRoute = () => ({
  service: APP_SERVICE_NAME,
  timestamp: getCurrentTimestamp(),
});

const healthRoutes: FastifyPluginAsync = async (instance) => {
  instance.get(`/${SERVER}`, serverHealthCheckRoute);
};

export { healthRoutes };
