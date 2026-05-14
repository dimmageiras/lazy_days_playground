import camelCase from "lodash-es/camelCase.js";
import type { CamelCase } from "type-fest";

import {
  HTML_CHARS_PATTERN,
  HTML_ESCAPE_CHARS,
} from "@shared/constants/html.constant";

import { MapUtilsHelper } from "./map-utils.helper";
import { TypesHelper } from "./types.helper";

const { getMapValue } = MapUtilsHelper;
const { castAsType } = TypesHelper;

const escapeHtml = (str: string): string => {
  return str.replace(
    HTML_CHARS_PATTERN,
    (char) => getMapValue(HTML_ESCAPE_CHARS, char) ?? char,
  );
};

const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const safeCamelCase = <TString extends string>(
  str: TString,
): CamelCase<TString> => {
  return castAsType<CamelCase<TString>>(camelCase(str));
};

const toUpperCase = <TString extends string>(
  str: TString,
): Uppercase<TString> => {
  return castAsType<Uppercase<TString>>(str.toUpperCase());
};

const StringUtilsHelper = Object.freeze({
  escapeHtml,
  isString,
  safeCamelCase,
  toUpperCase,
} as const);

export { StringUtilsHelper };
