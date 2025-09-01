import { API_HEALTH_ENDPOINTS } from "@shared/constants/api-health.constant";
import { API_BASE_URL, HEALTH_URL } from "@shared/constants/base-urls.const";

const API_HEALTH_QUERY_KEYS = Object.freeze({
  GET_DATABASE_HEALTH: [
    `${API_BASE_URL}-${HEALTH_URL}` as const,
    API_HEALTH_ENDPOINTS.DATABASE,
  ],
  GET_SERVER_HEALTH: [
    `${API_BASE_URL}-${HEALTH_URL}` as const,
    API_HEALTH_ENDPOINTS.SERVER,
  ],
} as const);

export { API_HEALTH_QUERY_KEYS };
