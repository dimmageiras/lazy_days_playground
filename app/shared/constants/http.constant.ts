const HTTP_SCHEMES = Object.freeze({
  HTTP: "http",
  HTTPS: "https",
} as const);

const HTTP_STATUS = Object.freeze({
  OK: 200,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CSRF_TOKEN_MISMATCH: 419,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const);

const SAFE_HTTP_METHODS = Object.freeze({
  GET: "GET",
  HEAD: "HEAD",
  OPTIONS: "OPTIONS",
  TRACE: "TRACE",
} as const);

const UNSAFE_HTTP_METHODS = Object.freeze({
  DELETE: "DELETE",
  PATCH: "PATCH",
  POST: "POST",
  PUT: "PUT",
} as const);

const HTTP_METHODS = Object.freeze({
  SAFE: SAFE_HTTP_METHODS,
  UNSAFE: UNSAFE_HTTP_METHODS,
} as const);

export { HTTP_METHODS, HTTP_SCHEMES, HTTP_STATUS };
