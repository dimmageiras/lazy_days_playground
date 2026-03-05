import camelCase from "lodash/camelCase.js";
import type { CamelCase } from "type-fest";

import { TypeHelper } from "./type.helper.ts";

const { castAsType } = TypeHelper;

/**
 * Checks if a value is a string.
 *
 * @param value - The value to check
 * @returns True if the value is a string, false otherwise
 */
const isString = (value: unknown): value is string => typeof value === "string";

/**
 * Safely converts a string to camelCase while preserving type-level information
 * @param str - The input string to convert to camelCase
 * @returns The camelCase version of the input string with preserved type information
 */
const safeCamelCase = <TString extends string>(
  str: TString,
): CamelCase<TString> => {
  return castAsType<CamelCase<TString>>(camelCase(str));
};

/**
 * Converts a string to uppercase while preserving type-level information
 * @param str - The input string to convert to uppercase
 * @returns The uppercase version of the input string with preserved type information
 */
const toUpperCase = <TString extends string>(
  str: TString,
): Uppercase<TString> => {
  return castAsType<Uppercase<TString>>(str.toUpperCase());
};

export const StringUtilsHelper = {
  isString,
  safeCamelCase,
  toUpperCase,
};
