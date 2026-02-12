import camelCase from "lodash/camelCase";
import type { CamelCase } from "type-fest";

import { TypeHelper } from "@shared/helpers/type.helper";

const { castAsType } = TypeHelper;

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

export const StringUtilsHelper = {
  safeCamelCase,
};
