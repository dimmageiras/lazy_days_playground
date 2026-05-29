const wrapWithCallback = <TArgs extends Array<unknown>, TReturn>(
  original: (...args: TArgs) => TReturn,
  onCall: () => void,
): ((...args: TArgs) => TReturn) => {
  return (...args: TArgs): TReturn => {
    onCall();

    return original(...args);
  };
};

const FunctionWrapHelper = Object.freeze({
  wrapWithCallback,
} as const);

export { FunctionWrapHelper };
