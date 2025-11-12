import { BASE_COOKIE_CONFIG } from "../../shared/constants/cookie.constant.ts";
import { TIMING } from "../../shared/constants/timing.constant.ts";

const { DAYS_SEVEN_IN_S, MINUTES_FIFTEEN_IN_S, MINUTES_TEN_IN_S } = TIMING;

/**
 * Cookie names for authentication
 */
const AUTH_COOKIE_NAMES = Object.freeze({
  ACCESS_TOKEN: "access-token",
  REFRESH_TOKEN: "refresh-token",
} as const);

/**
 * Access token cookie configuration
 * Short-lived token for API access (15 minutes)
 */
const ACCESS_TOKEN_COOKIE_CONFIG = {
  ...BASE_COOKIE_CONFIG,
  maxAge: MINUTES_FIFTEEN_IN_S,
} as const;

/**
 * Gel PKCE verifier cookie configuration
 * Short-lived token for PKCE verification (10 minutes)
 */
const GEL_PKCE_VERIFIER_COOKIE_CONFIG = {
  ...BASE_COOKIE_CONFIG,
  maxAge: MINUTES_TEN_IN_S,
} as const;

/**
 * Refresh token cookie configuration
 * Long-lived token for getting new access tokens (7 days)
 */
const REFRESH_TOKEN_COOKIE_CONFIG = {
  ...BASE_COOKIE_CONFIG,
  maxAge: DAYS_SEVEN_IN_S,
} as const;

export {
  ACCESS_TOKEN_COOKIE_CONFIG,
  AUTH_COOKIE_NAMES,
  BASE_COOKIE_CONFIG,
  GEL_PKCE_VERIFIER_COOKIE_CONFIG,
  REFRESH_TOKEN_COOKIE_CONFIG,
};
