const isInteger = (value: unknown): value is number => {
  return Number.isInteger(value);
};

const isNumber = (value: unknown): value is number => {
  return Number.isFinite(value);
};

const NumberHelper = Object.freeze({
  isInteger,
  isNumber,
} as const);

export { NumberHelper };
