/**
 * HTTP status codes used across the application
 */
const HTTP_STATUS = Object.freeze({
  /** 200 - OK */
  OK: 200,
  /** 400 - Bad Request */
  BAD_REQUEST: 400,
  /** 401 - Authentication Required (no valid token) */
  UNAUTHORIZED: 401,
  /** 403 - Forbidden (valid token but insufficient permissions) */
  FORBIDDEN: 403,
  /** 404 - Not Found */
  NOT_FOUND: 404,
  /** 429 - Many Requests Error (rate limit exceeded) */
  MANY_REQUESTS_ERROR: 429,
  /** 500 - Internal Server Error */
  INTERNAL_SERVER_ERROR: 500,
  /** 503 - Service Unavailable */
  SERVICE_UNAVAILABLE: 503,
} as const);

export { HTTP_STATUS };
