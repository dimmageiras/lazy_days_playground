import type { UnknownArray } from "type-fest";

const wrapWithCallback = <TArgs extends UnknownArray, TReturn>(
  original: (...args: TArgs) => TReturn,
  onCall: () => void,
): ((...args: TArgs) => TReturn) => {
  return (...args: TArgs): TReturn => {
    onCall();

    return original(...args);
  };
};

const FunctionWrap = Object.freeze({
  wrapWithCallback,
} as const);

export { FunctionWrap };
