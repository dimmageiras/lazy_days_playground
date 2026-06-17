import { HEADERS } from "@server/constants/headers.constant";

const { SHUTDOWN_TOKEN } = HEADERS;

const REDACT_PATHS = Object.freeze([
  `req.headers["${SHUTDOWN_TOKEN}"]`,
] as const);

export { REDACT_PATHS };
