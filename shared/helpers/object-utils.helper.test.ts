import { describe } from "vitest";

import {
  COMMON_PRIMITIVE_VALUES,
  createObjectWithNullishValues,
  createObjectWithNumericKeys,
  createObjectWithSymbolKeys,
  createTestClassInstance,
  testFunction,
} from "../test-utils/test-data";
import { ObjectUtilsHelper } from "./object-utils.helper";

describe("ObjectUtilsHelper", () => {
  const { getObjectEntries, getObjectKeys, getObjectValues, isPlainObject } =
    ObjectUtilsHelper;

  describe("getObjectEntries", (it) => {
    it("returns typed entries for a simple object", ({ expect }) => {
      const obj = { name: "John", age: 30 };
      const entries = getObjectEntries(obj);

      expect(entries).toEqual([
        ["name", "John"],
        ["age", 30],
      ]);
      expect(entries[0]![0]).toBe("name");
      expect(entries[0]![1]).toBe("John");
      expect(entries[1]![0]).toBe("age");
      expect(entries[1]![1]).toBe(30);
    });

    it("returns typed entries for an object with mixed types", ({ expect }) => {
      const obj = {
        string: "text",
        number: 42,
        boolean: true,
        array: [1, 2, 3],
      };
      const entries = getObjectEntries(obj);

      expect(entries).toEqual([
        ["string", "text"],
        ["number", 42],
        ["boolean", true],
        ["array", [1, 2, 3]],
      ]);
    });

    it("returns empty array for empty object", ({ expect }) => {
      const obj = {};
      const entries = getObjectEntries(obj);

      expect(entries).toEqual([]);
    });

    it("preserves key ordering", ({ expect }) => {
      const obj = { z: 1, a: 2, m: 3 };
      const entries = getObjectEntries(obj);

      expect(entries).toEqual([
        ["z", 1],
        ["a", 2],
        ["m", 3],
      ]);
    });

    it("handles objects with symbol keys by filtering them out", ({
      expect,
    }) => {
      const obj = createObjectWithSymbolKeys();
      const entries = getObjectEntries(obj);

      expect(entries).toEqual([["normal", "value"]]);
    });

    it("handles objects with numeric keys", ({ expect }) => {
      const obj = createObjectWithNumericKeys();
      const entries = getObjectEntries(obj);

      expect(entries).toEqual([
        ["1", "one"],
        ["2", "two"],
        ["3", "three"],
      ]);
    });
  });

  describe("getObjectKeys", (it) => {
    it("returns typed keys for a simple object", ({ expect }) => {
      const obj = { name: "John", age: 30 };
      const keys = getObjectKeys(obj);

      expect(keys).toEqual(["name", "age"]);
      expect(keys).toContain("name");
      expect(keys).toContain("age");
    });

    it("returns typed keys for an object with mixed key types", ({
      expect,
    }) => {
      const obj = { string: "text", 42: "number", "complex-key": "value" };
      const keys = getObjectKeys(obj);

      expect(keys).toEqual(["42", "string", "complex-key"]);
    });

    it("returns empty array for empty object", ({ expect }) => {
      const obj = {};
      const keys = getObjectKeys(obj);

      expect(keys).toEqual([]);
    });

    it("preserves key ordering", ({ expect }) => {
      const obj = { z: 1, a: 2, m: 3 };
      const keys = getObjectKeys(obj);

      expect(keys).toEqual(["z", "a", "m"]);
    });

    it("handles objects with symbol keys by filtering them out", ({
      expect,
    }) => {
      const obj = createObjectWithSymbolKeys();
      const keys = getObjectKeys(obj);

      expect(keys).toEqual(["normal"]);
    });
  });

  describe("getObjectValues", (it) => {
    it("returns typed values for a simple object", ({ expect }) => {
      const obj = { name: "John", age: 30 };
      const values = getObjectValues(obj);

      expect(values).toEqual(["John", 30]);
      expect(values).toContain("John");
      expect(values).toContain(30);
    });

    it("returns typed values for an object with mixed types", ({ expect }) => {
      const obj = {
        string: "text",
        number: 42,
        boolean: true,
        array: [1, 2, 3],
      };
      const values = getObjectValues(obj);

      expect(values).toEqual(["text", 42, true, [1, 2, 3]]);
    });

    it("returns empty array for empty object", ({ expect }) => {
      const obj = {};
      const values = getObjectValues(obj);

      expect(values).toEqual([]);
    });

    it("preserves value ordering based on key ordering", ({ expect }) => {
      const obj = { z: 1, a: 2, m: 3 };
      const values = getObjectValues(obj);

      expect(values).toEqual([1, 2, 3]);
    });

    it("handles objects with symbol keys by filtering them out", ({
      expect,
    }) => {
      const obj = createObjectWithSymbolKeys();
      const values = getObjectValues(obj);

      expect(values).toEqual(["value"]);
    });

    it("handles undefined and null values", ({ expect }) => {
      const obj = createObjectWithNullishValues();
      const values = getObjectValues(obj);

      expect(values).toEqual(["value", undefined, null]);
    });
  });

  describe("isPlainObject", (it) => {
    it("returns true for plain objects created with object literal", ({
      expect,
    }) => {
      const obj = { name: "John", age: 30 };

      expect(isPlainObject(obj)).toBe(true);
    });

    it("returns true for objects created with Object.create(null)", ({
      expect,
    }) => {
      const obj = Object.create(null);

      Reflect.set(obj, "name", "John");

      expect(isPlainObject(obj)).toBe(true);
    });

    it("returns true for empty plain objects", ({ expect }) => {
      const obj = {};

      expect(isPlainObject(obj)).toBe(true);
    });

    it("returns false for arrays", ({ expect }) => {
      const arr = [1, 2, 3];

      expect(isPlainObject(arr)).toBe(false);
    });

    it("returns false for null", ({ expect }) => {
      expect(isPlainObject(null)).toBe(false);
    });

    it("returns false for undefined", ({ expect }) => {
      expect(isPlainObject(undefined)).toBe(false);
    });

    it("returns false for primitive values", ({ expect }) => {
      COMMON_PRIMITIVE_VALUES.forEach((value) => {
        expect(isPlainObject(value)).toBe(false);
      });
    });

    it("returns false for Date objects", ({ expect }) => {
      const date = new Date();

      expect(isPlainObject(date)).toBe(false);
    });

    it("returns false for RegExp objects", ({ expect }) => {
      const regex = /test/;

      expect(isPlainObject(regex)).toBe(false);
    });

    it("returns false for Map objects", ({ expect }) => {
      const map = new Map();

      expect(isPlainObject(map)).toBe(false);
    });

    it("returns false for Set objects", ({ expect }) => {
      const set = new Set();

      expect(isPlainObject(set)).toBe(false);
    });

    it("returns false for class instances", ({ expect }) => {
      const instance = createTestClassInstance();

      expect(isPlainObject(instance)).toBe(false);
    });

    it("returns false for objects with custom prototypes", ({ expect }) => {
      const customProto = { custom: true };
      const obj = Object.create(customProto);

      Reflect.set(obj, "name", "test");

      expect(isPlainObject(obj)).toBe(false);
    });

    it("returns true for function prototypes (they inherit from Object.prototype)", ({
      expect,
    }) => {
      const proto = testFunction.prototype;

      expect(isPlainObject(proto)).toBe(true);
    });

    it("returns true for Object.prototype (it has null prototype)", ({
      expect,
    }) => {
      expect(isPlainObject(Object.prototype)).toBe(true);
    });

    it("returns false for Array.prototype (it has [object Array] class)", ({
      expect,
    }) => {
      expect(isPlainObject(Array.prototype)).toBe(false);
    });
  });
});
