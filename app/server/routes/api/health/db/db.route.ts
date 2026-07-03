import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";
import type { AppInstance } from "@server/types/instance.type";

import { DateHelper } from "@shared/helpers/date.helper";

const { DB } = API_HEALTH_ENDPOINTS;

const { getCurrentISOTimestamp } = DateHelper;

const dbRoute = async (instance: AppInstance): Promise<void> => {
  const readDbHealth = async () => {
    await instance.dbClient.ensureConnected();

    return {
      branch: instance.appEnv.dbBranch,
      timestamp: getCurrentISOTimestamp(),
    };
  };

  instance.get(`/${DB}`, readDbHealth);
};

export { dbRoute };
