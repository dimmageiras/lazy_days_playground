const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const TimingHelper = Object.freeze({
  delay,
} as const);

export { TimingHelper };
