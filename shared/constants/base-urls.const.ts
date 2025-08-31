/**
 * Base URL for all API endpoints
 */
const API_BASE_URL = "/api";

/**
 * Base URL for API health check endpoints
 * Used for server and database health monitoring
 */
const API_HEALTH_BASE_URL = `${API_BASE_URL}/health`;

/**
 * Base URL for user-related endpoints
 * Used for profile management and user operations
 */
const USER_BASE_URL = "/user";

export { API_HEALTH_BASE_URL, USER_BASE_URL };
