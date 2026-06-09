import { TIMING_IN_MS } from "@shared/constants/timing.constant";

const { SECONDS_FIVE, SECONDS_TEN } = TIMING_IN_MS;

const GRACEFUL_SHUTDOWN_ENDPOINTS = Object.freeze({
  SHUTDOWN: "graceful-shutdown",
} as const);

// Strictly larger than the app's requestTimeout (SECONDS_TEN) so a request
// running to its own timeout still drains before close-with-grace's force-exit
// fires.
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = SECONDS_TEN + SECONDS_FIVE;

const SHUTTING_DOWN = "shutting down…";

export {
  GRACEFUL_SHUTDOWN_ENDPOINTS,
  GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  SHUTTING_DOWN,
};
