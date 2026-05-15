const BIND_ALL_IPV4 = "0.0.0.0" as const;

const LOOPBACK_HOST_V4 = "127.0.0.1" as const;

const LOOPBACK_HOSTS: ReadonlySet<string> = Object.freeze(
  new Set([
    LOOPBACK_HOST_V4,
    "::1",
    // IPv4 loopback as it appears on dual-stack sockets (v4-mapped IPv6).
    "::ffff:127.0.0.1",
  ] as const),
);

const HOSTS = Object.freeze({
  BIND_ALL_IPV4,
  LOOPBACK_HOST_V4,
  LOOPBACK_HOSTS,
} as const);

const HTTP_PROTOCOLS = Object.freeze({
  HTTP: "http:" as const,
  HTTPS: "https:" as const,
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

const SAFE_HTTP_METHODS = Object.freeze(
  new Set(["GET", "HEAD", "OPTIONS", "TRACE"] as const),
);

const UNSAFE_HTTP_METHODS = Object.freeze(
  new Set(["DELETE", "PATCH", "POST", "PUT"] as const),
);

const HTTP_METHODS = Object.freeze({
  SAFE: SAFE_HTTP_METHODS,
  UNSAFE: UNSAFE_HTTP_METHODS,
} as const);

export { HOSTS, HTTP_METHODS, HTTP_PROTOCOLS, HTTP_STATUS };
