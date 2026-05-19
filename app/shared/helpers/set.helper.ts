import type { SetValue } from "@shared/types/app/utility-types";

const hasSetValue = <TSet extends ReadonlySet<unknown>>(
  set: TSet,
  value: SetValue<TSet> | (string & {}),
): value is SetValue<TSet> => set.has(value);

const SetHelper = Object.freeze({
  hasSetValue,
} as const);

export { SetHelper };
