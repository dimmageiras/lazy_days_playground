import { describe } from "vitest";

import { ObjectUtilsHelper } from "./object-utils.helper";

const { getObjectEntries, getObjectKeys, getObjectValues, isPlainObject } =
  ObjectUtilsHelper;

// Test data constants
const TEST_OBJECTS = {
  SIMPLE: { name: "John", age: 30, active: true },
  EMPTY: {},
  NESTED: {
    user: { name: "Jane", age: 25 },
    settings: { theme: "dark", notifications: true },
  },
  WITH_SYMBOLS: { [Symbol("test")]: "symbol", normal: "value" },
  WITH_NULL_VALUES: { name: null, age: undefined, active: false },
} as const;

const NON_OBJECTS = [
  null,
  undefined,
  "string",
  42,
  true,
  [],
  () => {},
  new Date(),
  /regex/,
] as const;

const NON_PLAIN_OBJECTS = [
  new (class TestClass {
    name = "test";
  })(),
  [],
  new Map(),
  new Set(),
  new Date(),
  /regex/,
  () => {},
  "string",
  42,
  true,
  null,
  undefined,
] as const;

describe("ObjectUtilsHelper", () => {
  describe("getObjectEntries", (it) => {
    it("should return typed entries for a simple object", ({ expect }) => {
      const result = getObjectEntries(TEST_OBJECTS.SIMPLE);

      expect(result).toEqual([
        ["name", "John"],
        ["age", 30],
        ["active", true],
      ]);

      // Type assertion to ensure proper typing
      result.forEach(([key]) => {
        expect(typeof key).toBe("string");
        expect(["name", "age", "active"]).toContain(key);
      });
    });

    it("should return empty array for empty object", ({ expect }) => {
      const result = getObjectEntries(TEST_OBJECTS.EMPTY);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should handle nested objects", ({ expect }) => {
      const result = getObjectEntries(TEST_OBJECTS.NESTED);

      expect(result).toEqual([
        ["user", { name: "Jane", age: 25 }],
        ["settings", { theme: "dark", notifications: true }],
      ]);

      result.forEach(([key, value]) => {
        expect(typeof key).toBe("string");
        expect(["user", "settings"]).toContain(key);
        expect(typeof value).toBe("object");
        expect(value).not.toBeNull();
      });
    });

    it("should handle objects with null and undefined values", ({ expect }) => {
      const result = getObjectEntries(TEST_OBJECTS.WITH_NULL_VALUES);

      expect(result).toEqual([
        ["name", null],
        ["age", undefined],
        ["active", false],
      ]);

      result.forEach(([key]) => {
        expect(typeof key).toBe("string");
        expect(["name", "age", "active"]).toContain(key);
      });
    });
  });

  describe("getObjectKeys", (it) => {
    it("should return typed keys for a simple object", ({ expect }) => {
      const result = getObjectKeys(TEST_OBJECTS.SIMPLE);

      expect(result).toEqual(["name", "age", "active"]);

      // Type assertion to ensure proper typing
      result.forEach((key) => {
        expect(typeof key).toBe("string");
        expect(["name", "age", "active"]).toContain(key);
      });
    });

    it("should return empty array for empty object", ({ expect }) => {
      const result = getObjectKeys(TEST_OBJECTS.EMPTY);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should handle nested objects", ({ expect }) => {
      const result = getObjectKeys(TEST_OBJECTS.NESTED);

      expect(result).toEqual(["user", "settings"]);

      result.forEach((key) => {
        expect(typeof key).toBe("string");
        expect(["user", "settings"]).toContain(key);
      });
    });

    it("should handle objects with symbol keys (excluding symbols)", ({
      expect,
    }) => {
      const result = getObjectKeys(TEST_OBJECTS.WITH_SYMBOLS);

      // Object.keys() only returns string keys, not symbol keys
      expect(result).toEqual(["normal"]);

      result.forEach((key) => {
        expect(typeof key).toBe("string");
        expect(key).toBe("normal");
      });
    });
  });

  describe("getObjectValues", (it) => {
    it("should return typed values for a simple object", ({ expect }) => {
      const result = getObjectValues(TEST_OBJECTS.SIMPLE);

      expect(result).toEqual(["John", 30, true]);

      // Type assertion to ensure proper typing
      result.forEach((value) => {
        expect(["John", 30, true]).toContain(value);
      });
    });

    it("should return empty array for empty object", ({ expect }) => {
      const result = getObjectValues(TEST_OBJECTS.EMPTY);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should handle nested objects", ({ expect }) => {
      const result = getObjectValues(TEST_OBJECTS.NESTED);

      expect(result).toEqual([
        { name: "Jane", age: 25 },
        { theme: "dark", notifications: true },
      ]);

      result.forEach((value) => {
        expect(typeof value).toBe("object");
        expect(value).not.toBeNull();
      });
    });

    it("should handle objects with null and undefined values", ({ expect }) => {
      const result = getObjectValues(TEST_OBJECTS.WITH_NULL_VALUES);

      expect(result).toEqual([null, undefined, false]);

      result.forEach((value) => {
        expect([null, undefined, false]).toContain(value);
      });
    });
  });

  describe("isPlainObject", (it) => {
    it("should return true for plain objects", ({ expect }) => {
      const plainObjects = [
        {},
        { name: "John" },
        TEST_OBJECTS.SIMPLE,
        TEST_OBJECTS.EMPTY,
        TEST_OBJECTS.NESTED,
        Object.create(Object.prototype),
      ];

      plainObjects.forEach((obj) => {
        expect(isPlainObject(obj)).toBe(true);
      });
    });

    it("should return true for objects created with Object.create(null)", ({
      expect,
    }) => {
      const nullProtoObj = Object.create(null);

      Reflect.set(nullProtoObj, "name", "test");

      expect(isPlainObject(nullProtoObj)).toBe(true);
    });

    it("should return false for non-objects", ({ expect }) => {
      NON_OBJECTS.forEach((item) => {
        expect(isPlainObject(item)).toBe(false);
      });
    });

    it("should return false for non-plain objects", ({ expect }) => {
      NON_PLAIN_OBJECTS.forEach((item) => {
        if (item !== null && item !== undefined) {
          expect(isPlainObject(item)).toBe(false);
        }
      });
    });
  });
});
