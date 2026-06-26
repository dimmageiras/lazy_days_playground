import type { KeyAsString, UnknownRecord, ValueOf } from "type-fest";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import type { ObjectEntries } from "@shared/types/app/utility-types";

import { ObjectHelper } from "./object.helper";
import { TypeHelper } from "./type.helper";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_NUMBER,
    COMMON_STRING,
    COMMON_TWO_STRING_ARRAY,
    EMPTY_ARRAY,
    EMPTY_IMMUTABLE_MAP,
    EMPTY_IMMUTABLE_SET,
    EMPTY_OBJECT,
    NULL_VALUE,
    NUMBER_1,
    STRING_A,
    STRING_B,
    UNDEFINED_VALUE,
    toUnknown,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("object.helper");

const { castAsType } = TypeHelper;

const {
  getObjectEntries,
  getObjectKeys,
  getObjectValues,
  hasObjectKey,
  isObjectKey,
  isPlainObject,
  stripKeysInPlace,
} = ObjectHelper;

const { makeObject, ...TEST_DATA } = {
  ABSENT_KEY: COMMON_STRING,
  EXPECTED_ENTRIES: [
    [STRING_A, NUMBER_1],
    [STRING_B, COMMON_NUMBER],
  ],
  EXPECTED_KEYS: COMMON_TWO_STRING_ARRAY,
  EXPECTED_VALUES: [NUMBER_1, COMMON_NUMBER],
  NON_PLAIN_OBJECT_CASES: [
    { name: "should return false for an array", value: EMPTY_ARRAY },
    { name: "should return false for a Map", value: EMPTY_IMMUTABLE_MAP },
    { name: "should return false for a Set", value: EMPTY_IMMUTABLE_SET },
    { name: "should return false for a string", value: COMMON_STRING },
    { name: "should return false for a number", value: COMMON_NUMBER },
    { name: "should return false for null", value: NULL_VALUE },
    { name: "should return false for undefined", value: UNDEFINED_VALUE },
  ],
  PLAIN_OBJECT_CASES: [
    { name: "should return true for an empty object", value: EMPTY_OBJECT },
    {
      name: "should return true for a populated object",
      value: { [STRING_A]: NUMBER_1 },
    },
  ],
  PRESENT_KEY: castAsType<string>(STRING_A),
  get makeObject() {
    return () => ({ [STRING_A]: NUMBER_1, [STRING_B]: COMMON_NUMBER });
  },
} as const;

describe("ObjectHelper", () => {
  describe("getObjectEntries", (it) => {
    it("should return the object's entries", ({ expect }) => {
      const object = makeObject();

      expect(getObjectEntries(object)).toStrictEqual(
        TEST_DATA.EXPECTED_ENTRIES,
      );

      expectTypeOf(getObjectEntries(object)).toEqualTypeOf<
        ObjectEntries<typeof object>
      >();
    });
  });

  describe("getObjectKeys", (it) => {
    it("should return the object's keys", ({ expect }) => {
      const object = makeObject();

      expect(getObjectKeys(object)).toStrictEqual(TEST_DATA.EXPECTED_KEYS);

      expectTypeOf(getObjectKeys(object)).toEqualTypeOf<
        Array<KeyAsString<typeof object>>
      >();
    });
  });

  describe("getObjectValues", (it) => {
    it("should return the object's values", ({ expect }) => {
      const object = makeObject();

      expect(getObjectValues(object)).toStrictEqual(TEST_DATA.EXPECTED_VALUES);

      expectTypeOf(getObjectValues(object)).toEqualTypeOf<
        Array<ValueOf<typeof object>>
      >();
    });
  });

  describe("hasObjectKey", (it) => {
    it("should return true for an own key", ({ expect }) => {
      expect(hasObjectKey(makeObject(), STRING_A)).toBe(BOOLEAN_TRUE);
    });

    it("should return false for an absent key", ({ expect }) => {
      expect(hasObjectKey(makeObject(), TEST_DATA.ABSENT_KEY)).toBe(
        BOOLEAN_FALSE,
      );
    });

    it("should narrow the object so the key is indexable when true", ({
      expect,
    }) => {
      const object = makeObject();
      const { PRESENT_KEY } = TEST_DATA;

      expect(hasObjectKey(object, PRESENT_KEY)).toBe(BOOLEAN_TRUE);

      if (hasObjectKey(object, PRESENT_KEY)) {
        expectTypeOf(Reflect.get(object, PRESENT_KEY)).toEqualTypeOf<unknown>();
      }
    });
  });

  describe("isObjectKey", (it) => {
    it("should return true for an own key", ({ expect }) => {
      expect(isObjectKey(makeObject(), STRING_A)).toBe(BOOLEAN_TRUE);
    });

    it("should return false for an absent key", ({ expect }) => {
      expect(isObjectKey(makeObject(), TEST_DATA.ABSENT_KEY)).toBe(
        BOOLEAN_FALSE,
      );
    });

    it("should narrow the key to keyof the object when true", ({ expect }) => {
      const object = makeObject();
      const { PRESENT_KEY } = TEST_DATA;

      expect(isObjectKey(object, PRESENT_KEY)).toBe(BOOLEAN_TRUE);

      if (isObjectKey(object, PRESENT_KEY)) {
        expectTypeOf(PRESENT_KEY).toEqualTypeOf<keyof typeof object>();
      }
    });
  });

  describe("isPlainObject", (it) => {
    TEST_DATA.PLAIN_OBJECT_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isPlainObject(value)).toBe(BOOLEAN_TRUE);
      });
    });

    TEST_DATA.NON_PLAIN_OBJECT_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isPlainObject(value)).toBe(BOOLEAN_FALSE);
      });
    });

    it("should return true for a null-prototype object", ({ expect }) => {
      expect(isPlainObject(Object.create(null))).toBe(BOOLEAN_TRUE);
    });

    it("should return false for a class instance", ({ expect }) => {
      expect(isPlainObject(new Error(COMMON_STRING))).toBe(BOOLEAN_FALSE);
    });

    it("should narrow the value to a record when true", ({ expect }) => {
      const value = toUnknown(EMPTY_OBJECT);

      expect(isPlainObject(value)).toBe(BOOLEAN_TRUE);

      if (isPlainObject(value)) {
        expectTypeOf(value).toEqualTypeOf<UnknownRecord>();
      }
    });
  });

  describe("stripKeysInPlace", (it) => {
    it("should remove the targeted key and leave the rest", ({ expect }) => {
      const result = stripKeysInPlace(makeObject(), [STRING_A]);

      expect(hasObjectKey(result, STRING_A)).toBe(BOOLEAN_FALSE);
      expect(hasObjectKey(result, STRING_B)).toBe(BOOLEAN_TRUE);
      expect(getObjectKeys(result)).toStrictEqual([STRING_B]);
    });

    it("should mutate and return the same object reference", ({ expect }) => {
      const object = makeObject();

      expect(stripKeysInPlace(object, [STRING_A])).toBe(object);
    });

    it("should be a no-op for a key absent from the object", ({ expect }) => {
      const object = makeObject();

      stripKeysInPlace(object, [TEST_DATA.ABSENT_KEY]);

      expect(getObjectKeys(object)).toStrictEqual(TEST_DATA.EXPECTED_KEYS);
    });

    it("should type the result as Omit of the stripped keys", ({ expect }) => {
      const object = makeObject();

      const result = stripKeysInPlace(object, [STRING_A]);

      expect(hasObjectKey(result, STRING_B)).toBe(BOOLEAN_TRUE);

      expectTypeOf(result).toEqualTypeOf<
        Omit<typeof object, typeof STRING_A>
      >();
    });
  });
});
