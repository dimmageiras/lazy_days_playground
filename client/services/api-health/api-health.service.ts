import axios from "axios";

import { API_HEALTH_ENDPOINTS } from "@shared/constants/api.constant";
import { API_HEALTH_BASE_URL } from "@shared/constants/base-urls.const";
import type {
  HealthDatabaseListResponse,
  HealthServerListResponse,
} from "@shared/types/api-health.type";

const { DATABASE, SERVER } = API_HEALTH_ENDPOINTS;

const BASE_URL = `/${API_HEALTH_BASE_URL}` as const;

const getDatabaseHealth = async (): Promise<HealthDatabaseListResponse> => {
  const url = `${BASE_URL}/${DATABASE}` as const;
  const response = await axios.get<HealthDatabaseListResponse>(url);

  return response.data;
};

const getServerHealth = async (): Promise<HealthServerListResponse> => {
  const url = `${BASE_URL}/${SERVER}` as const;
  const response = await axios.get<HealthServerListResponse>(url);

  return response.data;
};

export const ApiHealthService = {
  getDatabaseHealth,
  getServerHealth,
};
