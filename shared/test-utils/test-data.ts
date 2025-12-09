/**
 * Shared test data and utilities for unit tests
 * This file contains common test fixtures and helper functions used across multiple test files
 */

/**
 * Common primitive values used for testing type guards and validation functions
 */
export const PRIMITIVE_VALUES = [
  "string",
  42,
  true,
  Symbol("test"),
  BigInt(123),
] as const;

/**
 * Primitive values excluding BigInt (for tests that don't support BigInt)
 */
export const COMMON_PRIMITIVE_VALUES = [
  "string",
  42,
  true,
  Symbol("test"),
] as const;

/**
 * Common built-in objects used for testing type guards
 */
export const BUILTIN_OBJECTS = [
  new Date(),
  /test/,
  new Map(),
  new Set(),
  Promise.resolve(),
] as const;

/**
 * Creates a test class instance for testing class instances in type guards
 */
export const createTestClassInstance = (): unknown =>
  new (class {
    name = "test";
  })();

/**
 * Dummy function for testing function type guards
 */
export function testFunction(): void {
  return;
}

/**
 * Array-like object without Array prototype for testing
 */
export const createArrayLikeObject = (): Record<string, unknown> => ({
  length: 3,
  0: "a",
  1: "b",
  2: "c",
});

/**
 * Creates an object with symbol keys for testing key filtering
 */
export const createObjectWithSymbolKeys = (): Record<string, unknown> => {
  const symbolKey = Symbol("test");

  return {
    normal: "value",
    [symbolKey]: "symbolValue",
  };
};

/**
 * Creates an object with numeric string keys for testing
 */
export const createObjectWithNumericKeys = (): Record<string, unknown> => ({
  1: "one",
  2: "two",
  "3": "three",
});

/**
 * Creates an object with undefined and null values for testing
 */
export const createObjectWithNullishValues = (): Record<string, unknown> => ({
  defined: "value",
  undefined: undefined,
  null: null,
});
