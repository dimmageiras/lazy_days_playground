const isFiniteNumber = (value: unknown): value is number => {
  return Number.isFinite(value);
};

const isInteger = (value: unknown): value is number => {
  return Number.isInteger(value);
};

const NumberHelper = Object.freeze({
  isFiniteNumber,
  isInteger,
} as const);

export { NumberHelper };
