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
  object: TObject
): { [Key in keyof TObject]: [Key, TObject[Key]] }[keyof TObject][] =>
  Object.entries(object) as {
    [Key in keyof TObject]: [Key, TObject[Key]];
  }[keyof TObject][];

/**
 * Checks if the given value is an object and not an array.
 *
 * @param item - The value to check
 * @returns True if the value is an object and not an array, false otherwise
 */
const isObject = (item: unknown): item is Record<PropertyKey, unknown> => {
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
  isObject,
  isPlainObject,
};
