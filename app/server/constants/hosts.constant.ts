import { Set } from "immutable";

const LOOPBACK_HOST_V4 = "127.0.0.1" as const;

const LOOPBACK_HOSTS = Set<string>([
  LOOPBACK_HOST_V4,
  "::1",
  `::ffff:${LOOPBACK_HOST_V4}`,
]);

const HOSTS = Object.freeze({
  LOOPBACK_HOST_V4,
  LOOPBACK_HOSTS,
} as const);

export { HOSTS };
