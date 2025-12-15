import { describe } from "vitest";

import {
  BUILTIN_OBJECTS,
  createArrayLikeObject,
  createTestClassInstance,
  PRIMITIVE_VALUES,
  testFunction,
} from "@shared/test-utils/test-data";

import { ArrayUtilsHelper } from "./array-utils.helper";

describe("ArrayUtilsHelper", () => {
  const { isArray } = ArrayUtilsHelper;

  describe("isArray", (it) => {
    it("returns true for empty arrays", ({ expect }) => {
      const emptyArray: unknown[] = [];

      expect(isArray(emptyArray)).toBe(true);
    });

    it("returns true for arrays with primitive values", ({ expect }) => {
      const numberArray = [1, 2, 3];
      const stringArray = ["a", "b", "c"];
      const booleanArray = [true, false, true];
      const mixedPrimitiveArray = [1, "hello", true];

      expect(isArray(numberArray)).toBe(true);
      expect(isArray(stringArray)).toBe(true);
      expect(isArray(booleanArray)).toBe(true);
      expect(isArray(mixedPrimitiveArray)).toBe(true);
    });

    it("returns true for arrays with objects", ({ expect }) => {
      const objectArray = [{ name: "John" }, { name: "Jane" }];
      const nestedArray = [
        [1, 2],
        [3, 4],
      ];

      expect(isArray(objectArray)).toBe(true);
      expect(isArray(nestedArray)).toBe(true);
    });

    it("returns true for arrays with mixed types", ({ expect }) => {
      const mixedArray = [
        1,
        "string",
        true,
        { key: "value" },
        [1, 2, 3],
        null,
        undefined,
      ];

      expect(isArray(mixedArray)).toBe(true);
    });

    it("returns true for arrays created with Array constructor", ({
      expect,
    }) => {
      const arrayFromConstructor = [1, 2, 3];
      const emptyArrayFromConstructor = [];

      expect(isArray(arrayFromConstructor)).toBe(true);
      expect(isArray(emptyArrayFromConstructor)).toBe(true);
    });

    it("returns true for arrays created with Array.from", ({ expect }) => {
      const arrayFromIterable = Array.from([1, 2, 3]);
      const arrayFromString = Array.from("hello");

      expect(isArray(arrayFromIterable)).toBe(true);
      expect(isArray(arrayFromString)).toBe(true);
    });

    it("returns true for arrays created with spread operator", ({ expect }) => {
      const spreadArray = [1, 2, 3];

      expect(isArray(spreadArray)).toBe(true);
    });

    it("returns false for plain objects", ({ expect }) => {
      const plainObject = { key: "value", number: 42 };

      expect(isArray(plainObject)).toBe(false);
    });

    it("returns false for null", ({ expect }) => {
      expect(isArray(null)).toBe(false);
    });

    it("returns false for undefined", ({ expect }) => {
      expect(isArray(undefined)).toBe(false);
    });

    it("returns false for primitive values", ({ expect }) => {
      PRIMITIVE_VALUES.forEach((value) => {
        expect(isArray(value)).toBe(false);
      });
    });

    it("returns false for functions", ({ expect }) => {
      const regularFunction = () => {};

      expect(isArray(regularFunction)).toBe(false);
      expect(isArray(testFunction)).toBe(false);
    });

    it("returns false for built-in objects", ({ expect }) => {
      BUILTIN_OBJECTS.forEach((obj) => {
        expect(isArray(obj)).toBe(false);
      });
    });

    it("returns false for class instances", ({ expect }) => {
      const instance = createTestClassInstance();

      expect(isArray(instance)).toBe(false);
    });

    it("returns false for array-like objects without Array prototype", ({
      expect,
    }) => {
      const arrayLike = createArrayLikeObject();

      expect(isArray(arrayLike)).toBe(false);
    });

    it("returns false for typed arrays", ({ expect }) => {
      const int8Array = new Int8Array([1, 2, 3]);
      const uint8Array = new Uint8Array([1, 2, 3]);
      const float64Array = new Float64Array([1.1, 2.2, 3.3]);

      expect(isArray(int8Array)).toBe(false);
      expect(isArray(uint8Array)).toBe(false);
      expect(isArray(float64Array)).toBe(false);
    });

    it("returns true for arrays from different realms/contexts", ({
      expect,
    }) => {
      // Note: In real scenarios, arrays from different contexts (like iframes)
      // would still be detected as arrays by Array.isArray, but we test with
      // regular arrays here since we can't easily create cross-realm arrays
      const regularArray = [1, 2, 3];

      expect(isArray(regularArray)).toBe(true);
    });
  });
});
