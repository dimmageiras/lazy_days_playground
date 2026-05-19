const HTTP_PROTOCOLS = Object.freeze({
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

const SAFE_HTTP_METHODS: ReadonlySet<"GET" | "HEAD" | "OPTIONS" | "TRACE"> =
  new Set(["GET", "HEAD", "OPTIONS", "TRACE"] as const);

const UNSAFE_HTTP_METHODS: ReadonlySet<"DELETE" | "PATCH" | "POST" | "PUT"> =
  new Set(["DELETE", "PATCH", "POST", "PUT"] as const);

const HTTP_METHODS = Object.freeze({
  SAFE: SAFE_HTTP_METHODS,
  UNSAFE: UNSAFE_HTTP_METHODS,
} as const);

export { HTTP_METHODS, HTTP_PROTOCOLS, HTTP_STATUS };
