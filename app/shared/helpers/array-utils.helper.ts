import type { UnknownArray } from "type-fest";

const isArray = (value: unknown): value is UnknownArray => {
  return Array.isArray(value);
};

const ArrayUtilsHelper = Object.freeze({
  isArray,
} as const);

export { ArrayUtilsHelper };
