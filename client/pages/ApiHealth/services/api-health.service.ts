import axios from "axios";

import { API_HEALTH_ENDPOINTS } from "@shared/constants/api.constant";
import { API_HEALTH_BASE_URL } from "@shared/constants/base-urls.const";
import type {
  ApiHealthDatabaseCheckResponse,
  ApiHealthServerCheckResponse,
} from "@shared/types/api-health.type";

const { DATABASE, SERVER } = API_HEALTH_ENDPOINTS;

const getDatabaseHealth = async (): Promise<ApiHealthDatabaseCheckResponse> => {
  const url = `/${API_HEALTH_BASE_URL}/${DATABASE}` as const;
  const response = await axios.get<ApiHealthDatabaseCheckResponse>(url);

  return response.data;
};

const getServerHealth = async (): Promise<ApiHealthServerCheckResponse> => {
  const url = `/${API_HEALTH_BASE_URL}/${SERVER}` as const;
  const response = await axios.get<ApiHealthServerCheckResponse>(url);

  return response.data;
};

export const ApiHealthService = {
  getDatabaseHealth,
  getServerHealth,
};
