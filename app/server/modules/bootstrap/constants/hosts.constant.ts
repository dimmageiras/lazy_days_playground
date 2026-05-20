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

const SERVER_HOSTS = Object.freeze({
  BIND_ALL_IPV4,
  LOOPBACK_HOST_V4,
  LOOPBACK_HOSTS,
} as const);

export { SERVER_HOSTS };
