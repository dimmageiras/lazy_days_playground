import type { ValueOf } from "type-fest";

/**
 * Checks if a set contains a specific value.
 *
 * @template TSet - The set type
 * @template TValue - The value type
 * @param set - The set to check
 * @param value - The value to check for
 * @returns True if the set contains the value, false otherwise
 */
const hasSetValue = <TSet extends Set<unknown>, TValue extends ValueOf<TSet>>(
  set: TSet,
  value: TValue,
): value is TValue => set.has(value);

export const SetUtilsHelper = {
  hasSetValue,
};
