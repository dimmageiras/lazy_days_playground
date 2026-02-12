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

    it("should return false for non-objects", ({ expect }) => {
      NON_OBJECTS.forEach((item) => {
        expect(isPlainObject(item)).toBe(false);
      });
    });
  });
});
