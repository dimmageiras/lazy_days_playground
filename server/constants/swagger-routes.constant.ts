import {
  API_HEALTH_BASE_URL,
  API_REPORTS_BASE_URL,
  AUTH_BASE_URL,
  USER_BASE_URL,
} from "../../shared/constants/base-urls.constant.ts";

const SWAGGER_ROUTES = Object.freeze({
  API_HEALTH: API_HEALTH_BASE_URL,
  API_REPORTS: API_REPORTS_BASE_URL,
  AUTH: AUTH_BASE_URL,
  USER: USER_BASE_URL,
} as const);

export { SWAGGER_ROUTES };
