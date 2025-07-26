import lodash from "lodash";
import type { CamelCase } from "type-fest";

const { camelCase } = lodash;

const safeCamelCase = <T extends string>(str: T): CamelCase<T> => {
  return camelCase(str) as CamelCase<T>;
};

export const StringManipulationHelper = {
  safeCamelCase,
};
