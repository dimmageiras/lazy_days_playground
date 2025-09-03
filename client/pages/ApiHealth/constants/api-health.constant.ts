import { API_HEALTH_ENDPOINTS } from "@shared/constants/api.constant";
import { API_BASE_URL, HEALTH_URL } from "@shared/constants/base-urls.const";

const { DATABASE, SERVER } = API_HEALTH_ENDPOINTS;

const API_HEALTH_QUERY_KEYS = Object.freeze({
  GET_DATABASE_HEALTH: [`${API_BASE_URL}-${HEALTH_URL}` as const, DATABASE],
  GET_SERVER_HEALTH: [`${API_BASE_URL}-${HEALTH_URL}` as const, SERVER],
} as const);

export { API_HEALTH_QUERY_KEYS };
