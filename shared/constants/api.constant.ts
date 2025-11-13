const API_DOCS_ENDPOINTS = Object.freeze({
  SWAGGER: "swagger",
} as const);

const API_HEALTH_ENDPOINTS = Object.freeze({
  DATABASE: "database",
  SERVER: "server",
} as const);

const API_REPORTS_ENDPOINTS = Object.freeze({
  CLEAR_CSP_REPORTS: "csp-clear",
  CREATE_CSP_REPORT: "csp-report",
  GET_CSP_REPORTS: "csp-list",
} as const);

export { API_DOCS_ENDPOINTS, API_HEALTH_ENDPOINTS, API_REPORTS_ENDPOINTS };
