const toError = (errorToConvert: unknown): Error =>
  errorToConvert instanceof Error
    ? errorToConvert
    : new Error(String(errorToConvert));

const normalizeError = (
  errorToConvert: unknown,
): { error: string; stack: string | undefined } => {
  const error = toError(errorToConvert);

  return { error: error.message, stack: error.stack };
};

const ErrorHelper = Object.freeze({
  normalizeError,
  toError,
} as const);

export { ErrorHelper };
