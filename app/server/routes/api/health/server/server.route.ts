import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";
import type { OpenApiSchema } from "@server/modules/openapi";
import type { AppInstance } from "@server/types/instance.type";

import { HTTP_STATUS } from "@shared/constants/http.constant";
import { DateHelper } from "@shared/helpers/date.helper";

import { serverHealthResponseSchema } from "./schemas/server.schema";

const { SERVER } = API_HEALTH_ENDPOINTS;
const { OK } = HTTP_STATUS;

const { getCurrentISOTimestamp } = DateHelper;

const serverRoute = async (instance: AppInstance): Promise<void> => {
  const readServerHealth = () => ({
    service: instance.appEnv.serviceName,
    timestamp: getCurrentISOTimestamp(),
  });

  instance.get(
    `/${SERVER}`,
    {
      schema: {
        description:
          "Returns the health status of the server for monitoring and load balancers.",
        response: {
          [OK]: {
            content: {
              "application/json": { schema: serverHealthResponseSchema },
            },
          },
        },
        summary: "Check server health status",
        tags: ["API Health"],
      } satisfies OpenApiSchema,
    },
    readServerHealth,
  );
};

export { serverRoute };
