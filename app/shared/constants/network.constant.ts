const LOOPBACK_HOSTS = new Set([
  "127.0.0.1",
  "::1",
  // Dual-stack hosts surface IPv4 loopback connections as v4-mapped IPv6
  // when the server binds to "::". Covers the case where the bind host ever
  // changes from "0.0.0.0" to "::" without breaking the cooperative handoff.
  "::ffff:127.0.0.1",
] as const);

const HOSTS: {
  BIND_ALL_IPV4: string;
  LOOPBACK_HOSTS: ReadonlySet<
    typeof LOOPBACK_HOSTS extends Set<infer Value>
      ? Value | (string & {})
      : never
  >;
} = Object.freeze({
  BIND_ALL_IPV4: "0.0.0.0",
  LOOPBACK_HOSTS,
} as const);

const HTTP_STATUS = Object.freeze({
  OK: 200,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  /** No valid credentials. */
  UNAUTHORIZED: 401,
  /** Authenticated but not permitted. */
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CSRF_TOKEN_MISMATCH: 419,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const);

const METHODS = Object.freeze({
  DELETE: "DELETE",
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
} as const);

const PROTOCOLS = Object.freeze({
  HTTP: "http",
  HTTPS: "https",
} as const);

export { HOSTS, HTTP_STATUS, METHODS, PROTOCOLS };
