import { TIMING_IN_MS as SHARED_TIMING_IN_MS } from "@shared/constants/timing.constant";

const { SECONDS_FIVE, SECONDS_TEN } = SHARED_TIMING_IN_MS;

const TIMING_IN_MS = Object.freeze({
  SHUTDOWN_TIMEOUT: SECONDS_TEN + SECONDS_FIVE,
} as const);

export { TIMING_IN_MS };
