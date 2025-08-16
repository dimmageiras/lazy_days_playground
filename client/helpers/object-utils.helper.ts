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
  isObject,
  isPlainObject,
};
