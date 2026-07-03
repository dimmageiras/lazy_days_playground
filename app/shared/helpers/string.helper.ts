import camelCase from "lodash-es/camelCase.js";
import lodashReplace from "lodash-es/replace.js";
import type { CamelCase, Replace } from "type-fest";

import { TypeHelper } from "./type.helper";

const { castAsType } = TypeHelper;

const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const replace = <
  TString extends string,
  TSearch extends string,
  TReplacement extends string,
>(
  str: TString,
  search: TSearch,
  replacement: TReplacement,
): Replace<TString, TSearch, TReplacement> => {
  return castAsType<Replace<TString, TSearch, TReplacement>>(
    lodashReplace(str, search, () => replacement),
  );
};

const toCamelCase = <TString extends string>(
  str: TString,
): CamelCase<TString> => {
  return castAsType<CamelCase<TString>>(camelCase(str));
};

const toUpperCase = <TString extends string>(
  str: TString,
): Uppercase<TString> => {
  return castAsType<Uppercase<TString>>(str.toUpperCase());
};

const StringHelper = Object.freeze({
  isString,
  replace,
  toCamelCase,
  toUpperCase,
} as const);

export { StringHelper };
