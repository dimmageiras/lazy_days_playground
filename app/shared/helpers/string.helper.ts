import camelCase from "lodash-es/camelCase.js";

const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const toCamelCase = (str: string): string => {
  return camelCase(str);
};

const toUpperCase = <TString extends string>(
  str: TString,
): Uppercase<TString> => {
  return str.toUpperCase() as Uppercase<TString>;
};

const StringHelper = Object.freeze({
  isString,
  toCamelCase,
  toUpperCase,
} as const);

export { StringHelper };
