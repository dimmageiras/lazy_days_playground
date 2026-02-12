import type { KeyAsString, ValueOf } from "type-fest";

import { TypeHelper } from "./type.helper.ts";

const { castAsType } = TypeHelper;

/**
 * Gets typed entries from an object, preserving key-value type relationships.
 * This is a type-safe wrapper around Object.entries() that maintains proper typing.
 *
 * @template TObject - Object type extending Record<string, unknown>
 * @param object - The object to get entries from
 * @returns Array of [key, value] tuples with preserved typing
 *
 * @example
 * ```typescript
 * const obj = { name: "John", age: 30 };
 * const entries = getObjectEntries(obj);
 * // entries: [["name", "John"], ["age", 30]]
 * ```
 */
const getObjectEntries = <TObject extends Record<string, unknown>>(
  object: TObject,
): {
  [Key in KeyAsString<TObject>]: [Key, ValueOf<TObject>];
}[KeyAsString<TObject>][] =>
  castAsType<
    {
      [Key in KeyAsString<TObject>]: [Key, ValueOf<TObject>];
    }[KeyAsString<TObject>][]
  >(Object.entries(object));

/**
 * Gets typed keys from an object.
 * This is a type-safe wrapper around Object.keys() that returns properly typed keys.
 *
 * @template TObject - Object type extending Record<string, unknown>
 * @param object - The object to get keys from
 * @returns Array of object keys with proper typing
 *
 * @example
 * ```typescript
 * const obj = { name: "John", age: 30 };
 * const keys = getObjectKeys(obj);
 * // keys: ("name" | "age")[]
 * ```
 */
const getObjectKeys = <TObject extends Record<string, unknown>>(
  object: TObject,
): KeyAsString<TObject>[] =>
  castAsType<KeyAsString<TObject>[]>(Object.keys(object));

/**
 * Gets typed values from an object.
 * This is a type-safe wrapper around Object.values() that returns properly typed values.
 *
 * @template TObject - Object type extending Record<string, unknown>
 * @param object - The object to get values from
 * @returns Array of object values with proper typing
 */
const getObjectValues = <T extends Record<string, unknown>>(
  initialObject: T,
): ValueOf<T>[] => castAsType<ValueOf<T>[]>(Object.values(initialObject));

/**
 * Checks if the given value is an object and not an array.
 *
 * @param item - The value to check
 * @returns True if the value is an object and not an array, false otherwise
 */
const isObject = (item: unknown): item is Record<string, unknown> => {
  return typeof item === "object" && item !== null && !Array.isArray(item);
};

/**
 * Checks if the given value is a plain object.
 *
 * @param item - The value to check
 * @returns True if the value is a plain object, false otherwise
 */
const isPlainObject = (item: unknown): item is Record<PropertyKey, unknown> => {
  if (!isObject(item)) {
    return false;
  }

  // Check if it's a plain object by examining its prototype
  const proto = Reflect.getPrototypeOf(item);

  // Plain objects have either null prototype (Object.create(null))
  // or Object.prototype as their prototype
  return proto === null || proto === Object.prototype;
};

export const ObjectUtilsHelper = {
  getObjectEntries,
  getObjectKeys,
  getObjectValues,
  isObject,
  isPlainObject,
};
