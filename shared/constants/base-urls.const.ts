/** Base URL for authentication endpoints */
const AUTH_BASE_URL = "auth";

/**
 * Base URL for all API endpoints
 */
const API_BASE_URL = "api";

/** Docs documentation URL */
const DOCS_URL = "docs";

/** Base URL for Docs documentation */
const API_DOCS_BASE_URL = `${API_BASE_URL}/${DOCS_URL}`;

/** Health URL */
const HEALTH_URL = "health";

/** Base URL for API health check endpoints */
const API_HEALTH_BASE_URL = `${API_BASE_URL}/${HEALTH_URL}`;

/** Base URL for user-related endpoints */
const USER_BASE_URL = "user";

export {
  API_BASE_URL,
  API_DOCS_BASE_URL,
  API_HEALTH_BASE_URL,
  AUTH_BASE_URL,
  HEALTH_URL,
  USER_BASE_URL,
};
