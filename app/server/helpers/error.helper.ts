const toError = (value: unknown): Error => {
  return value instanceof Error ? value : new Error(String(value));
};

const normalizeError = (
  value: unknown,
): { error: string; stack: string | undefined } => {
  const error = toError(value);

  return { error: error.message, stack: error.stack };
};

const ErrorHelper = Object.freeze({
  normalizeError,
  toError,
} as const);

export { ErrorHelper };
