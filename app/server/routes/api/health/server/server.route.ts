import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";
import type { AppInstance } from "@server/types/instance.type";

import { DateHelper } from "@shared/helpers/date.helper";

const { SERVER } = API_HEALTH_ENDPOINTS;

const { getCurrentISOTimestamp } = DateHelper;

const serverRoute = async (instance: AppInstance): Promise<void> => {
  instance.get(`/${SERVER}`, () => ({
    service: instance.appEnv.serviceName,
    timestamp: getCurrentISOTimestamp(),
  }));
};

export { serverRoute };
