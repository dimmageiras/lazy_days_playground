import type { TimingInMilliseconds } from "@shared/types/timing.type";

const delay = (ms: TimingInMilliseconds): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const TimingHelper = Object.freeze({
  delay,
} as const);

export { TimingHelper };
