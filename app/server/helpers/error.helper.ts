const isErrnoException = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && "code" in error;
};

const toError = (errorToConvert: unknown): Error => {
  return errorToConvert instanceof Error
    ? errorToConvert
    : new Error(String(errorToConvert));
};

const normalizeError = (
  errorToConvert: unknown,
): { error: string; stack: string | undefined } => {
  const error = toError(errorToConvert);

  return { error: error.message, stack: error.stack };
};

const ErrorHelper = Object.freeze({
  isErrnoException,
  normalizeError,
  toError,
} as const);

export { ErrorHelper };
