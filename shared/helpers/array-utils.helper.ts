/**
 * Checks if the given value is an array.
 *
 * @param value - The value to check
 * @returns True if the value is an array, false otherwise
 */
const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

export const ArrayUtilsHelper = {
  isArray,
};
