const BIND_ALL_IPV4 = "0.0.0.0" as const;

const LOOPBACK_HOST_V4 = "127.0.0.1" as const;

const LOOPBACK_HOSTS: Set<string> = new Set([
  LOOPBACK_HOST_V4,
  "::1",
  // Dual-stack hosts surface IPv4 loopback connections as v4-mapped IPv6
  // when the server binds to "::". Covers the case where the bind host ever
  // changes from "0.0.0.0" to "::" without breaking the cooperative handoff.
  "::ffff:127.0.0.1",
]);

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

const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"] as const);
const UNSAFE_HTTP_METHODS = new Set([
  "DELETE",
  "PATCH",
  "POST",
  "PUT",
] as const);
export {
  HOSTS,
  HTTP_PROTOCOLS,
  HTTP_STATUS,
  SAFE_HTTP_METHODS,
  UNSAFE_HTTP_METHODS,
};
