import { API_HEALTH_BASE_URL } from "../../shared/constants/base-urls.const.ts";

const SWAGGER_ROUTES = Object.freeze({
  API_HEALTH: API_HEALTH_BASE_URL,
} as const);

export { SWAGGER_ROUTES };
