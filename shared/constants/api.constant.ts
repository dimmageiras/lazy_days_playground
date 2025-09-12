const API_DOCS_ENDPOINTS = Object.freeze({
  SWAGGER: "swagger",
} as const);

const API_HEALTH_ENDPOINTS = Object.freeze({
  DATABASE: "database",
  SERVER: "server",
} as const);

const AUTH_ENDPOINTS = Object.freeze({
  SIGNIN: "signin",
  SIGNUP: "signup",
  VERIFY: "verify",
} as const);

export { API_DOCS_ENDPOINTS, API_HEALTH_ENDPOINTS, AUTH_ENDPOINTS };
