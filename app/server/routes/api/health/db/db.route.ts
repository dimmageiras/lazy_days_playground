import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";
import type { AppInstance } from "@server/types/instance.type";

import { DateHelper } from "@shared/helpers/date.helper";

const { DB } = API_HEALTH_ENDPOINTS;

const { getCurrentISOTimestamp } = DateHelper;

const dbRoute = async (instance: AppInstance): Promise<void> => {
  instance.get(`/${DB}`, async () => {
    await instance.dbClient.ensureConnected();

    return {
      db: instance.appEnv.dbName,
      timestamp: getCurrentISOTimestamp(),
    };
  });
};

export { dbRoute };
