import { AUTH_ENDPOINTS } from "@shared/constants/auth.constant";
import { AUTH_BASE_URL } from "@shared/constants/base-urls.constant";

const { LOGOUT, SIGNIN, SIGNUP, VERIFY_AUTH } = AUTH_ENDPOINTS;

const AUTH_ACTION_URL = "/auth.data" as const;

const AUTH_QUERY_KEYS = Object.freeze({
  AUTH_FORM_SUBMISSION: ["auth-form-submission"] as const,
  LOGOUT: [AUTH_BASE_URL, LOGOUT] as const,
  SIGNIN: [AUTH_BASE_URL, SIGNIN] as const,
  SIGNUP: [AUTH_BASE_URL, SIGNUP] as const,
  VERIFY_AUTH: [AUTH_BASE_URL, VERIFY_AUTH] as const,
} as const);

export { AUTH_ACTION_URL, AUTH_QUERY_KEYS };
