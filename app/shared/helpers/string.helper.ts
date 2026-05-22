import camelCase from "lodash-es/camelCase.js";

import { TypesHelper } from "./types.helper";

const { castAsType } = TypesHelper;

const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const toCamelCase = (str: string): string => {
  return camelCase(str);
};

const toUpperCase = <TString extends string>(
  str: TString,
): Uppercase<TString> => {
  return castAsType<Uppercase<TString>>(str.toUpperCase());
};

const StringHelper = Object.freeze({
  isString,
  toCamelCase,
  toUpperCase,
} as const);

export { StringHelper };
