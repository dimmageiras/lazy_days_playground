/**
 * Base URL for all API endpoints
 */
const API_BASE_URL = "api";

/** Health URL */
const HEALTH_URL = "health";

/** Base URL for API health check endpoints */
const API_HEALTH_BASE_URL = `${API_BASE_URL}/${HEALTH_URL}`;

/** Swagger documentation URL */
const SWAGGER_URL = "swagger";

/** Base URL for Swagger documentation */
const API_SWAGGER_BASE_URL = `${API_BASE_URL}/${SWAGGER_URL}`;

/** Base URL for user-related endpoints */
const USER_BASE_URL = "user";

export {
  API_BASE_URL,
  API_HEALTH_BASE_URL,
  API_SWAGGER_BASE_URL,
  HEALTH_URL,
  SWAGGER_URL,
  USER_BASE_URL,
};
