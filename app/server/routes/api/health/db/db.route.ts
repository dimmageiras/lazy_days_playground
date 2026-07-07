import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";
import type {
  OpenApiSchema,
  OpenApiTypeProvider,
} from "@server/modules/openapi";
import type { AppInstance } from "@server/types/instance.type";

import { HTTP_STATUS } from "@shared/constants/http.constant";
import { DateHelper } from "@shared/helpers/date.helper";

import { dbHealthResponseSchema } from "./schemas/db.schema";

const { DB } = API_HEALTH_ENDPOINTS;
const { OK } = HTTP_STATUS;

const { getCurrentISOTimestamp } = DateHelper;

const dbRoute = async (instance: AppInstance): Promise<void> => {
  const readDbHealth = async () => {
    await instance.dbClient.ensureConnected();

    return {
      branch: instance.appEnv.dbBranch,
      timestamp: getCurrentISOTimestamp(),
    };
  };

  instance.withTypeProvider<OpenApiTypeProvider>().get(
    `/${DB}`,
    {
      schema: {
        description:
          "Confirms the database connection and returns the connected branch with an ISO timestamp.",
        response: {
          [OK]: {
            content: {
              "application/json": { schema: dbHealthResponseSchema },
            },
          },
        },
        summary: "Check database health status",
        tags: ["API Health"],
      } satisfies OpenApiSchema,
    },
    readDbHealth,
  );
};

export { dbRoute };
