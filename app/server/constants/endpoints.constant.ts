const API_DOCS_ENDPOINTS = Object.freeze({
  SWAGGER: "swagger",
} as const);

const API_HEALTH_ENDPOINTS = Object.freeze({
  DB: "db",
  SERVER: "server",
} as const);

const API_INTERNAL_ENDPOINTS = Object.freeze({
  SHUTDOWN: "shutdown",
} as const);

export { API_DOCS_ENDPOINTS, API_HEALTH_ENDPOINTS, API_INTERNAL_ENDPOINTS };
