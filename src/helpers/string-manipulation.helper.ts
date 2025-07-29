import lodash from "lodash";
import type { CamelCase } from "type-fest";

const { camelCase } = lodash;

/**
 * Safely converts a string to camelCase while preserving type-level information
 * @param str - The input string to convert to camelCase
 * @returns The camelCase version of the input string with preserved type information
 */
const safeCamelCase = <T extends string>(str: T): CamelCase<T> => {
  return camelCase(str) as CamelCase<T>;
};

export const StringManipulationHelper = {
  safeCamelCase,
};
