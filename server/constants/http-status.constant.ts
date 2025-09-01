/**
 * HTTP status codes used across the application
 */
const HTTP_STATUS = Object.freeze({
  /** 200 - OK */
  OK: 200,
  /** 400 - Bad Request */
  BAD_REQUEST: 400,
  /** 401 - Authentication required (no valid token) */
  UNAUTHORIZED: 401,
  /** 403 - Forbidden (valid token but insufficient permissions) */
  FORBIDDEN: 403,
  /** 404 - Not Found */
  NOT_FOUND: 404,
  /** 500 - Internal server error */
  INTERNAL_SERVER_ERROR: 500,
  /** 503 - Service Unavailable */
  SERVICE_UNAVAILABLE: 503,
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
