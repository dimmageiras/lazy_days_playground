import type { AxiosResponse } from "axios";
import axios from "axios";

import { API_HEALTH_ENDPOINTS } from "@shared/constants/api.constant";
import { API_HEALTH_BASE_URL } from "@shared/constants/base-urls.constant";
import type {
  HealthDatabaseListData,
  HealthDatabaseListError,
  HealthServerListData,
} from "@shared/types/generated/server/api-health.type";

const BASE_URL = `/${API_HEALTH_BASE_URL}` as const;

const getDatabaseHealth = async (): Promise<
  AxiosResponse<HealthDatabaseListData | HealthDatabaseListError>
> => {
  const { DATABASE } = API_HEALTH_ENDPOINTS;

  const url = `${BASE_URL}/${DATABASE}` as const;
  const response = await axios.get<
    HealthDatabaseListData | HealthDatabaseListError
  >(url);

  return response;
};

const getServerHealth = async (): Promise<
  AxiosResponse<HealthServerListData>
> => {
  const { SERVER } = API_HEALTH_ENDPOINTS;

  const url = `${BASE_URL}/${SERVER}` as const;
  const response = await axios.get<HealthServerListData>(url);

  return response;
};

export const ApiHealthService = {
  getDatabaseHealth,
  getServerHealth,
};
