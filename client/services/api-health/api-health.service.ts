import axios from "axios";

import { API_HEALTH_ENDPOINTS } from "@shared/constants/api.constant";
import { API_HEALTH_BASE_URL } from "@shared/constants/base-urls.const";
import type {
  HealthDatabaseListData,
  HealthDatabaseListError,
  HealthServerListData,
} from "@shared/types/generated/api-health.type";

const { DATABASE, SERVER } = API_HEALTH_ENDPOINTS;

const BASE_URL = `/${API_HEALTH_BASE_URL}` as const;

const getDatabaseHealth = async (): Promise<
  HealthDatabaseListData | HealthDatabaseListError
> => {
  const url = `${BASE_URL}/${DATABASE}` as const;
  const response = await axios.get<
    HealthDatabaseListData | HealthDatabaseListError
  >(url);

  return response.data;
};

const getServerHealth = async (): Promise<HealthServerListData> => {
  const url = `${BASE_URL}/${SERVER}` as const;
  const response = await axios.get<HealthServerListData>(url);

  return response.data;
};

export const ApiHealthService = {
  getDatabaseHealth,
  getServerHealth,
};
