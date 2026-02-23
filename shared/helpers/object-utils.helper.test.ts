import { describe } from "vitest";

import { ObjectUtilsHelper } from "./object-utils.helper";

const {
  getObjectEntries,
  getObjectKeys,
  getObjectValues,
  hasObjectKey,
  isPlainObject,
} = ObjectUtilsHelper;

// Test data constants
const TEST_DATA = {
  EXPECTED_KEYS: ["name", "age", "active"] as const,
  EXPECTED_VALUES: ["John", 30, true] as const,
  NON_OBJECTS: [
    null,
    undefined,
    "string",
    42,
    true,
    [],
    () => {},
    new Date(),
    /regex/,
  ],
  OBJECTS: {
    SIMPLE: { name: "John", age: 30, active: true },
    EMPTY: {},
    NESTED: {
      user: { name: "Jane", age: 25 },
      settings: { theme: "dark", notifications: true },
    },
  },

  PLAIN_OBJECTS: [{}, { name: "John" }] as const,
} as const;

describe("ObjectUtilsHelper", () => {
  describe("getObjectEntries", (it) => {
    it("should return typed entries for a simple object", ({ expect }) => {
      const result = getObjectEntries(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual([
        ["name", "John"],
        ["age", 30],
        ["active", true],
      ]);

      // Type assertion to ensure proper typing
      result.forEach(([key]) => {
        expect(typeof key).toBe("string");
        expect(TEST_DATA.EXPECTED_KEYS).toContain(key);
      });
    });
  });

  describe("getObjectKeys", (it) => {
    it("should return typed keys for a simple object", ({ expect }) => {
      const result = getObjectKeys(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual(["name", "age", "active"]);

      // Type assertion to ensure proper typing
      result.forEach((key) => {
        expect(typeof key).toBe("string");
        expect(TEST_DATA.EXPECTED_KEYS).toContain(key);
      });
    });
  });

  describe("getObjectValues", (it) => {
    it("should return typed values for a simple object", ({ expect }) => {
      const result = getObjectValues(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual(["John", 30, true]);

      // Type assertion to ensure proper typing
      result.forEach((value) => {
        expect(TEST_DATA.EXPECTED_VALUES).toContain(value);
      });
    });
  });

  describe("hasObjectKey", (it) => {
    it("should return true when the key exists", ({ expect }) => {
      expect(hasObjectKey(TEST_DATA.OBJECTS.SIMPLE, "name")).toBe(true);
    });

    it("should return false when the key does not exist", ({ expect }) => {
      expect(hasObjectKey(TEST_DATA.OBJECTS.SIMPLE, "unknown")).toBe(false);
    });

    it("should return false for an empty object", ({ expect }) => {
      expect(hasObjectKey(TEST_DATA.OBJECTS.EMPTY, "name")).toBe(false);
    });

    it("should return false for arrays", ({ expect }) => {
      expect(hasObjectKey([], "length")).toBe(false);
    });

    it("should return true for inherited prototype keys", ({ expect }) => {
      expect(hasObjectKey(TEST_DATA.OBJECTS.SIMPLE, "toString")).toBe(true);
    });
  });

  describe("isPlainObject", (it) => {
    it("should return true for plain objects", ({ expect }) => {
      const plainObjects = [
        ...TEST_DATA.PLAIN_OBJECTS,
        TEST_DATA.OBJECTS.SIMPLE,
        TEST_DATA.OBJECTS.EMPTY,
        TEST_DATA.OBJECTS.NESTED,
        Object.create(Object.prototype),
      ];

      plainObjects.forEach((obj) => {
        expect(isPlainObject(obj)).toBe(true);
      });
    });

    it("should return false for non-objects", ({ expect }) => {
      TEST_DATA.NON_OBJECTS.forEach((item) => {
        expect(isPlainObject(item)).toBe(false);
      });
    });
  });
});
