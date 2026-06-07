import { TIMING_IN_MS } from "@shared/constants/timing.constant";

const { SECONDS_TEN } = TIMING_IN_MS;

const GRACEFUL_SHUTDOWN_ROUTE = "graceful-shutdown";
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = SECONDS_TEN;

export { GRACEFUL_SHUTDOWN_ROUTE, GRACEFUL_SHUTDOWN_TIMEOUT_MS };
