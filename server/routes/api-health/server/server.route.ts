import type { FastifyInstance } from "fastify";

import { API_HEALTH_ENDPOINTS } from "../../../../shared/constants/api.constant.ts";
import { DateHelper } from "../../../../shared/helpers/date.helper.ts";
import type { ApiHealthServerSuccessResponse } from "../../../../shared/types/api-health.type.ts";
import { zToJSONSchema } from "../../../../shared/wrappers/zod.wrapper.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { serverHealthSchema } from "./server-route.schema.ts";

const serverRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { getCurrentISOTimestamp } = DateHelper;

  const serverHealthRouteSchema = {
    description:
      "Returns the health status of the server for monitoring and load balancers",
    response: {
      200: zToJSONSchema(serverHealthSchema),
      500: zToJSONSchema(serverHealthSchema),
    },
    summary: "Check server health status",
    tags: ["Health"],
  } as const;

  fastify.get(
    `/${API_HEALTH_ENDPOINTS.SERVER}`,
    { schema: serverHealthRouteSchema },
    async (_request, reply) => {
      const response: ApiHealthServerSuccessResponse = {
        service: "lazy_days_playground",
        timestamp: getCurrentISOTimestamp(),
      };

      return reply.status(HTTP_STATUS.OK).send(response);
    }
  );
};

export { serverRoute };
