import { Set } from "immutable";

const HOSTS = Object.freeze({
  LOOPBACK_HOST_V4: "127.0.0.1",
  get LOOPBACK_HOSTS(): Set<string> {
    return Set<string>([
      HOSTS.LOOPBACK_HOST_V4,
      "::1",
      `::ffff:${HOSTS.LOOPBACK_HOST_V4}`,
    ]);
  },
} as const);

export { HOSTS };
