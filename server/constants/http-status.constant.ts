/**
 * HTTP status codes used in authentication and authorization
 */
const HTTP_STATUS = Object.freeze({
  /** 401 - Authentication required (no valid token) */
  UNAUTHORIZED: 401,
  /** 403 - Forbidden (valid token but insufficient permissions) */
  FORBIDDEN: 403,
  /** 500 - Internal server error */
  INTERNAL_SERVER_ERROR: 500,
} as const);

/**
 * Standard error messages for authentication and authorization
 */
const AUTH_ERROR_MESSAGES = Object.freeze({
  /** For 401 errors - missing or invalid authentication */
  AUTHENTICATION_REQUIRED: "Authentication required",
  /** For 403 errors - insufficient permissions */
  ADMIN_ACCESS_REQUIRED: "Admin access required",
  /** For 500 errors - internal server issues */
  INTERNAL_SERVER_ERROR: "Internal server error",
  /** When admin verification is called without JWT verification */
  MISSING_JWT_VERIFICATION:
    "Admin verification called without JWT verification",
} as const);

export { AUTH_ERROR_MESSAGES, HTTP_STATUS };
