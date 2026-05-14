import type { ValueOf } from "type-fest";

const hasSetValue = <
  TSet extends Set<unknown>,
  TValue extends ValueOf<TSet> | (string & {}),
>(
  set: TSet,
  value: TValue,
): value is NoInfer<TValue> => set.has(value);

const SetUtilsHelper = Object.freeze({
  hasSetValue,
} as const);

export { SetUtilsHelper };
