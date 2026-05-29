import type { Set as ImmutableSet } from "immutable";

import type { SetValue } from "@shared/types/app/utility-types";

const addValuesInSet = <TSet extends Set<unknown>>(
  set: TSet,
  values: ReadonlyArray<SetValue<TSet> | (PropertyKey & {})>,
): void => {
  for (const value of values) {
    set.add(value);
  }
};

const hasSetValue = <
  TSet extends ImmutableSet<unknown> | Set<unknown> | ReadonlySet<unknown>,
>(
  set: TSet,
  value: SetValue<TSet> | (PropertyKey & {}),
): value is SetValue<TSet> => set.has(value);

const stripValuesInSet = <TSet extends Set<unknown>>(
  set: TSet,
  values: ReadonlyArray<SetValue<TSet> | (PropertyKey & {})>,
): void => {
  for (const value of values) {
    set.delete(value);
  }
};

const SetHelper = Object.freeze({
  addValuesInSet,
  hasSetValue,
  stripValuesInSet,
} as const);

export { SetHelper };
