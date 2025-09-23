import { AUTH_ENDPOINTS } from "@shared/constants/auth.constant";
import { USER_BASE_URL } from "@shared/constants/base-urls.const";

const { SIGNIN, SIGNUP, VERIFY } = AUTH_ENDPOINTS;

const AUTH_QUERY_KEYS = Object.freeze({
  SIGNIN: [USER_BASE_URL, SIGNIN] as const,
  SIGNUP: [USER_BASE_URL, SIGNUP] as const,
  VERIFY: [USER_BASE_URL, VERIFY] as const,
} as const);

export { AUTH_QUERY_KEYS };
