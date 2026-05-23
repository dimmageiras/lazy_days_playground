import { VitestSetup } from "@configs/vitest/setup";
import { describe, expectTypeOf } from "vitest";

import { ObjectHelper } from "./object.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("object.helper");

const {
  getObjectEntries,
  getObjectKeys,
  getObjectValues,
  hasObjectKey,
  isObjectKey,
  isPlainObject,
  stripKeysInPlace,
} = ObjectHelper;

class TaggedClass {
  tag = "I am a tagged class instance";
}

const TEST_DATA = {
  EMPTY_ARRAY: [],
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
    Object.create({ a: 1 }),
    new TaggedClass(),
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
  OWN_KEY_CASES: [
    {
      expected: false,
      key: "name",
      name: "should return false for an empty-object lookup",
      object: {},
    },
    {
      expected: false,
      key: "toString",
      name: "should return false for an inherited prototype key",
      object: { active: true, age: 30, name: "John" },
    },
    {
      expected: false,
      key: "unknown",
      name: "should return false for an absent key",
      object: { active: true, age: 30, name: "John" },
    },
    {
      expected: true,
      key: "length",
      name: "should return true for an array's own `length` property",
      object: [],
    },
    {
      expected: true,
      key: "name",
      name: "should return true for an own-property key",
      object: { active: true, age: 30, name: "John" },
    },
    {
      expected: true,
      key: "runtimeOnly",
      name: "should return true when the runtime object carries a key its declared type omits",
      object: { declared: 1, runtimeOnly: 2 } as Record<string, unknown>,
    },
  ],
  PLAIN_OBJECTS: [{}, { name: "John" }, Object.create(null) as object],
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
    it("should return entries matching the source object", ({ expect }) => {
      const result = getObjectEntries(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual(Object.entries(TEST_DATA.OBJECTS.SIMPLE));
    });

    it("should return an empty array for an empty object", ({ expect }) => {
      const result = getObjectEntries(TEST_DATA.OBJECTS.EMPTY);

      expect(result).toStrictEqual(TEST_DATA.EMPTY_ARRAY);
    });
  });

  describe("getObjectKeys", (it) => {
    it("should return keys matching the source object", ({ expect }) => {
      const result = getObjectKeys(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual(Object.keys(TEST_DATA.OBJECTS.SIMPLE));
    });

    it("should return an empty array for an empty object", ({ expect }) => {
      const result = getObjectKeys(TEST_DATA.OBJECTS.EMPTY);

      expect(result).toStrictEqual(TEST_DATA.EMPTY_ARRAY);
    });
  });

  describe("getObjectValues", (it) => {
    it("should return values matching the source object", ({ expect }) => {
      const result = getObjectValues(TEST_DATA.OBJECTS.SIMPLE);

      expect(result).toStrictEqual(Object.values(TEST_DATA.OBJECTS.SIMPLE));
    });

    it("should return an empty array for an empty object", ({ expect }) => {
      const result = getObjectValues(TEST_DATA.OBJECTS.EMPTY);

      expect(result).toStrictEqual(TEST_DATA.EMPTY_ARRAY);
    });
  });

  describe("hasObjectKey", (it) => {
    TEST_DATA.OWN_KEY_CASES.forEach(({ name, object, key, expected }) => {
      it(name, ({ expect }) => {
        expect(hasObjectKey(object, key)).toBe(expected);
      });
    });

    it("should narrow the object to include a key omitted from its type", ({
      expect,
    }) => {
      const object = { hidden: 99, visible: "x" } as { visible: string };

      expect(hasObjectKey(object, "hidden")).toBe(true);

      if (hasObjectKey(object, "hidden")) {
        expectTypeOf(object.hidden).toEqualTypeOf<unknown>();
        expect(object.hidden).toBe(99);
      }
    });
  });

  describe("isObjectKey", (it) => {
    TEST_DATA.OWN_KEY_CASES.forEach(({ name, object, key, expected }) => {
      it(name, ({ expect }) => {
        expect(isObjectKey(object, key)).toBe(expected);
      });
    });

    it("should narrow the key to keyof the object", ({ expect }) => {
      const object = TEST_DATA.NARROW.OBJECT;
      const key: string = TEST_DATA.NARROW.KEY;

      expect(isObjectKey(object, key)).toBe(true);

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
