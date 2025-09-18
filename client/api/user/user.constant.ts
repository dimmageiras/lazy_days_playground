import { USER_ENDPOINTS } from "@shared/constants/api.constant";
import { USER_BASE_URL } from "@shared/constants/base-urls.const";

const { CHECK_EMAIL } = USER_ENDPOINTS;

const USER_QUERY_KEYS = Object.freeze({
  CHECK_EMAIL: [USER_BASE_URL, CHECK_EMAIL] as const,
} as const);

export { USER_QUERY_KEYS };
