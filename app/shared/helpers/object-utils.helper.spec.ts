import { describe, expectTypeOf } from "vitest";

import { ObjectUtilsHelper } from "./object-utils.helper";

const {
  deleteObjectKeys,
  getObjectEntries,
  getObjectKeys,
  getObjectValues,
  hasObjectKey,
  isPlainObject,
} = ObjectUtilsHelper;

const TEST_DATA = {
  DELETE_CASES: [
    {
      name: "should remove all keys listed for deletion",
      keys: ["a", "b"],
      expected: { c: 3 },
    },
    {
      name: "should leave keys not listed for deletion intact",
      keys: ["a"],
      expected: { b: 2, c: 3 },
    },
    {
      name: "should be a no-op for a key not present on the object",
      keys: ["nonexistent"],
      expected: { a: 1, b: 2, c: 3 },
    },
  ] as const,
  EMPTY_ARRAY: [] as const,
  EXPECTED_ENTRIES: [
    ["name", "John"],
    ["age", 30],
    ["active", true],
  ] as const,
  EXPECTED_KEYS: ["name", "age", "active"] as const,
  EXPECTED_VALUES: ["John", 30, true] as const,
  KEYS: {
    ABSENT: "unknown",
    ARRAY_OWN: "length",
    EXISTING: "name",
    INHERITED: "toString",
  },
  NARROW: {
    EXPECTED_VALUE: 42,
    KEY: "extra",
    get OBJECT(): object {
      return { name: "John", extra: 42 };
    },
  },
  NON_PLAIN_OBJECTS: [
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
    EMPTY: {},
    NESTED: {
      user: { name: "Jane", age: 25 },
      settings: { theme: "dark", notifications: true },
    },
    SIMPLE: { name: "John", age: 30, active: true },
    get DELETABLE() {
      return { a: 1, b: 2, c: 3 };
    },
  },
  PLAIN_OBJECTS: [{}, { name: "John" }] as const,
  PROTO_OBJECT: Object.create(Object.prototype),
} as const;

describe("ObjectUtilsHelper", () => {
  describe("deleteObjectKeys", (it) => {
    TEST_DATA.DELETE_CASES.forEach(({ name, keys, expected }) => {
      it(name, ({ expect }) => {
        const object = TEST_DATA.OBJECTS.DELETABLE;

        const result = deleteObjectKeys(object, keys);

        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("getObjectEntries", (it) => {
    it("should return typed entries for a simple object", ({ expect }) => {
      const result = getObjectEntries(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_ENTRIES);

      result.forEach(([key]) => {
        expect(typeof key).toBe("string");
        expect(TEST_DATA.EXPECTED_KEYS).toContain(key);
      });
    });
  });

  describe("getObjectKeys", (it) => {
    it("should return typed keys for a simple object", ({ expect }) => {
      const result = getObjectKeys(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_KEYS);

      result.forEach((key) => {
        expect(typeof key).toBe("string");
        expect(TEST_DATA.EXPECTED_KEYS).toContain(key);
      });
    });
  });

  describe("getObjectValues", (it) => {
    it("should return typed values for a simple object", ({ expect }) => {
      const result = getObjectValues(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_VALUES);

      result.forEach((value) => {
        expect(TEST_DATA.EXPECTED_VALUES).toContain(value);
      });
    });
  });

  describe("hasObjectKey", (it) => {
    it("should return true when the key exists", ({ expect }) => {
      expect(hasObjectKey(TEST_DATA.OBJECTS.SIMPLE, TEST_DATA.KEYS.EXISTING)).toBe(
        true,
      );
    });

    it("should return false when the key does not exist", ({ expect }) => {
      expect(hasObjectKey(TEST_DATA.OBJECTS.SIMPLE, TEST_DATA.KEYS.ABSENT)).toBe(
        false,
      );
    });

    it("should return false for an empty object", ({ expect }) => {
      expect(hasObjectKey(TEST_DATA.OBJECTS.EMPTY, TEST_DATA.KEYS.EXISTING)).toBe(
        false,
      );
    });

    it("should return true for own array properties", ({ expect }) => {
      expect(
        hasObjectKey(TEST_DATA.EMPTY_ARRAY, TEST_DATA.KEYS.ARRAY_OWN),
      ).toBe(true);
    });

    it("should return true for inherited prototype keys", ({ expect }) => {
      expect(
        hasObjectKey(TEST_DATA.OBJECTS.SIMPLE, TEST_DATA.KEYS.INHERITED),
      ).toBe(true);
    });

    it("should narrow the object type to include the asserted key", ({
      expect,
    }) => {
      const value = TEST_DATA.NARROW.OBJECT;

      if (hasObjectKey(value, TEST_DATA.NARROW.KEY)) {
        expectTypeOf(value[TEST_DATA.NARROW.KEY]).toEqualTypeOf<unknown>();
        expect(value[TEST_DATA.NARROW.KEY]).toBe(TEST_DATA.NARROW.EXPECTED_VALUE);
      }
    });
  });

  describe("isPlainObject", (it) => {
    it("should return true for plain objects", ({ expect }) => {
      const plainObjects = [
        ...TEST_DATA.PLAIN_OBJECTS,
        TEST_DATA.OBJECTS.SIMPLE,
        TEST_DATA.OBJECTS.EMPTY,
        TEST_DATA.OBJECTS.NESTED,
        TEST_DATA.PROTO_OBJECT,
      ];

      plainObjects.forEach((obj) => {
        expect(isPlainObject(obj)).toBe(true);
      });
    });

    it("should return false for non-plain objects", ({ expect }) => {
      TEST_DATA.NON_PLAIN_OBJECTS.forEach((item) => {
        expect(isPlainObject(item)).toBe(false);
      });
    });
  });
});
