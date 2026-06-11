import { TIMING_IN_MS as SHARED_TIMING_IN_MS } from "@shared/constants/timing.constant";

const { SECONDS_FIFTEEN } = SHARED_TIMING_IN_MS;

const TIMING_IN_MS = Object.freeze({
  SHUTDOWN_TIMEOUT: SECONDS_FIFTEEN,
} as const);

export { TIMING_IN_MS };
