import type {
  AnySet,
  SetValue,
  SetValueInput,
} from "@shared/types/app/utility-types";

const addValuesInPlace = <TSet extends Set<unknown>>(
  set: TSet,
  values: ReadonlyArray<SetValueInput<TSet>>,
): void => {
  for (const value of values) {
    set.add(value);
  }
};

const hasSetValue = <TSet extends AnySet>(
  set: TSet,
  value: SetValue<TSet> | (PropertyKey & {}),
): value is SetValue<TSet> => set.has(value);

const stripValuesInPlace = <TSet extends Set<unknown>>(
  set: TSet,
  values: ReadonlyArray<SetValueInput<TSet>>,
): void => {
  for (const value of values) {
    set.delete(value);
  }
};

const SetHelper = Object.freeze({
  addValuesInPlace,
  hasSetValue,
  stripValuesInPlace,
} as const);

export { SetHelper };
