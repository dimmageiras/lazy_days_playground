import { ROUTES } from "@server/constants/routes.constant";
import { SERVICE } from "@server/constants/service.constant";
import type { FastifyPluginAsync } from "fastify";

import { DateHelper } from "@shared/helpers/date.helper";

const {
  API: {
    HEALTH: { SERVER },
  },
} = ROUTES;
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
