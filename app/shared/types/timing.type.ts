import type {
  TIMING_IN_MS,
  TIMING_IN_S,
} from "@shared/constants/timing.constant";

type TimingInMilliseconds =
  | (typeof TIMING_IN_MS)[keyof typeof TIMING_IN_MS]
  | (number & {});

type TimingInSeconds =
  | (typeof TIMING_IN_S)[keyof typeof TIMING_IN_S]
  | (number & {});

export type { TimingInMilliseconds, TimingInSeconds };
