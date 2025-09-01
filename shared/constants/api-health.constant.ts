const API_HEALTH_ENDPOINTS = Object.freeze({
  DATABASE: "database",
  SERVER: "server",
} as const);

const API_HEALTH_STATUSES = Object.freeze({
  HEALTHY: "healthy",
  UNHEALTHY: "unhealthy",
} as const);

export { API_HEALTH_ENDPOINTS, API_HEALTH_STATUSES };
