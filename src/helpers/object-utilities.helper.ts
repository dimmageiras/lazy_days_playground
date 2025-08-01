/**
 * Checks if the given value is an object and not an array.
 *
 * @param value - The value to check
 * @returns True if the value is an object and not an array, false otherwise
 */
const isObject = (value: unknown): value is Record<PropertyKey, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const ObjectUtilitiesHelper = {
  isObject,
};
