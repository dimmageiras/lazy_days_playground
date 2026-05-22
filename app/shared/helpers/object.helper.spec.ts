import { VitestSetup } from "@configs/vitest/setup";
import { describe, expectTypeOf } from "vitest";

import { ObjectHelper } from "./object.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("object.helper");

const {
  getObjectEntries,
  getObjectKeys,
  getObjectValues,
  isObjectKey,
  isPlainObject,
  stripKeysInPlace,
} = ObjectHelper;

const TEST_DATA = {
  EMPTY_ARRAY: [],
  EXPECTED_ENTRIES: [
    ["active", true],
    ["age", 30],
    ["name", "John"],
  ],
  EXPECTED_KEYS: ["active", "age", "name"],
  EXPECTED_VALUES: [true, 30, "John"],
  KEYS: {
    ABSENT: "unknown",
    ARRAY_OWN: "length",
    EXISTING: "name",
    INHERITED: "toString",
  },
  NARROW: {
    EXPECTED_VALUE: 42,
    KEY: "extra",
    OBJECT: { name: "John", extra: 42 },
  },
  NON_PLAIN_OBJECTS: [
    "string",
    () => {},
    [],
    /regex/,
    42,
    new Date(),
    null,
    true,
    undefined,
  ],
  OBJECTS: {
    DELETABLE: { a: 1, b: 2, c: 3 },
    EMPTY: {},
    NESTED: {
      settings: { notifications: true, theme: "dark" },
      user: { age: 25, name: "Jane" },
    },
    SIMPLE: { active: true, age: 30, name: "John" },
  },
  PLAIN_OBJECTS: [{}, { name: "John" }],
  PROTO_OBJECT: Object.create(Object.prototype),
  STRIP_CASES: [
    {
      expected: { c: 3 },
      keys: ["a", "b"],
      name: "should remove all keys listed for stripping",
    },
    {
      expected: { b: 2, c: 3 },
      keys: ["a"],
      name: "should leave keys not listed for stripping intact",
    },
    {
      expected: { a: 1, b: 2, c: 3 },
      keys: ["nonexistent"],
      name: "should be a no-op for a key not present on the object",
    },
  ],
} as const;

describe("ObjectHelper", () => {
  describe("getObjectEntries", (it) => {
    it("should return typed entries for a simple object", ({ expect }) => {
      const result = getObjectEntries(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_ENTRIES);

      result.forEach(([key]) => {
        expect(typeof key).toBe("string");
        expect(TEST_DATA.EXPECTED_KEYS).toContain(key);
      });
    });

    it("should return an empty array for an empty object", ({ expect }) => {
      const result = getObjectEntries(TEST_DATA.OBJECTS.EMPTY);

      expect(result).toStrictEqual(TEST_DATA.EMPTY_ARRAY);
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

    it("should return an empty array for an empty object", ({ expect }) => {
      const result = getObjectKeys(TEST_DATA.OBJECTS.EMPTY);

      expect(result).toStrictEqual(TEST_DATA.EMPTY_ARRAY);
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

    it("should return an empty array for an empty object", ({ expect }) => {
      const result = getObjectValues(TEST_DATA.OBJECTS.EMPTY);

      expect(result).toStrictEqual(TEST_DATA.EMPTY_ARRAY);
    });
  });

  describe("isObjectKey", (it) => {
    it("should return true for an own-property key", ({ expect }) => {
      expect(
        isObjectKey(TEST_DATA.OBJECTS.SIMPLE, TEST_DATA.KEYS.EXISTING),
      ).toBe(true);
    });

    it("should return false for an absent key", ({ expect }) => {
      expect(isObjectKey(TEST_DATA.OBJECTS.SIMPLE, TEST_DATA.KEYS.ABSENT)).toBe(
        false,
      );
    });

    it("should return false for an empty-object lookup", ({ expect }) => {
      expect(
        isObjectKey(TEST_DATA.OBJECTS.EMPTY, TEST_DATA.KEYS.EXISTING),
      ).toBe(false);
    });

    it("should return true for an own array property key", ({ expect }) => {
      expect(isObjectKey(TEST_DATA.EMPTY_ARRAY, TEST_DATA.KEYS.ARRAY_OWN)).toBe(
        true,
      );
    });

    it("should return false for an inherited prototype key", ({ expect }) => {
      expect(
        isObjectKey(TEST_DATA.OBJECTS.SIMPLE, TEST_DATA.KEYS.INHERITED),
      ).toBe(false);
    });

    it("should narrow the key to keyof the object", ({ expect }) => {
      const object = TEST_DATA.NARROW.OBJECT;
      const key: string = TEST_DATA.NARROW.KEY;

      if (isObjectKey(object, key)) {
        expectTypeOf(key).toEqualTypeOf<keyof typeof object>();
        expect(Reflect.get(object, key)).toBe(TEST_DATA.NARROW.EXPECTED_VALUE);
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

  describe("stripKeysInPlace", (it) => {
    TEST_DATA.STRIP_CASES.forEach(({ name, keys, expected }) => {
      it(name, ({ expect }) => {
        const object = { ...TEST_DATA.OBJECTS.DELETABLE };

        stripKeysInPlace(object, keys);

        expect(object).toStrictEqual(expected);
      });
    });
  });
});
