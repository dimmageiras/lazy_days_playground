import { describe, vi } from "vitest";

import { TypeHelper } from "@shared/helpers/type.helper";

import { ListRendererBaseHelper } from "./list-renderer-base.helper";

const { generateStableKey } = ListRendererBaseHelper;
const { castAsType } = TypeHelper;

const TEST_DATA = {
  INDEX_ZERO: 0,
  INDEX_FIVE: 5,
  STRING_ITEM: "test-string",
  NUMBER_ITEM: 42,
  BOOLEAN_ITEM: true,
  OBJECT_ITEM: { id: 1, name: "test" },
  ARRAY_ITEM: [1, 2, 3],
} as const;

describe("ListRendererBaseHelper", () => {
  describe("generateStableKey", (it) => {
    it("should use getKey function when provided", ({ expect }) => {
      const keyMap = new WeakMap();
      const getKey = vi.fn().mockReturnValue("custom-key");

      const result = generateStableKey(
        TEST_DATA.OBJECT_ITEM,
        TEST_DATA.INDEX_ZERO,
        keyMap,
        getKey,
      );

      expect(result).toBe("custom-key");
      expect(getKey).toHaveBeenCalledWith(
        TEST_DATA.OBJECT_ITEM,
        TEST_DATA.INDEX_ZERO,
      );
    });

    it("should convert getKey return value to string", ({ expect }) => {
      const keyMap = new WeakMap();
      const getKey = vi.fn().mockReturnValue(123);

      const result = generateStableKey(
        TEST_DATA.OBJECT_ITEM,
        TEST_DATA.INDEX_ZERO,
        keyMap,
        getKey,
      );

      expect(result).toBe("123");
    });

    it("should generate stable UUID for objects in WeakMap", ({ expect }) => {
      const keyMap = new WeakMap();
      const object = TEST_DATA.OBJECT_ITEM;

      const firstCall = generateStableKey(object, TEST_DATA.INDEX_ZERO, keyMap);
      const secondCall = generateStableKey(
        object,
        TEST_DATA.INDEX_FIVE,
        keyMap,
      );

      expect(firstCall).toBe(secondCall);
      expect(keyMap.has(object)).toBe(true);
    });

    it("should generate different UUIDs for different objects", ({
      expect,
    }) => {
      const keyMap = new WeakMap();
      const object1 = { id: 1 };
      const object2 = { id: 2 };

      const key1 = generateStableKey(object1, TEST_DATA.INDEX_ZERO, keyMap);
      const key2 = generateStableKey(object2, TEST_DATA.INDEX_ZERO, keyMap);

      expect(key1).not.toBe(key2);
    });

    it("should generate stable UUID for arrays in WeakMap", ({ expect }) => {
      const keyMap = new WeakMap();
      const array = TEST_DATA.ARRAY_ITEM;

      const firstCall = generateStableKey(array, TEST_DATA.INDEX_ZERO, keyMap);
      const secondCall = generateStableKey(array, TEST_DATA.INDEX_FIVE, keyMap);

      expect(firstCall).toBe(secondCall);
      expect(keyMap.has(array)).toBe(true);
    });

    it("should create composite key for string primitives", ({ expect }) => {
      const keyMap = new WeakMap();

      const result = generateStableKey(
        TEST_DATA.STRING_ITEM,
        TEST_DATA.INDEX_FIVE,
        keyMap,
      );

      expect(result).toBe(`${TEST_DATA.INDEX_FIVE}-${TEST_DATA.STRING_ITEM}`);
    });

    it("should create composite key for number primitives", ({ expect }) => {
      const keyMap = new WeakMap();

      const result = generateStableKey(
        TEST_DATA.NUMBER_ITEM,
        TEST_DATA.INDEX_FIVE,
        keyMap,
      );

      expect(result).toBe(`${TEST_DATA.INDEX_FIVE}-${TEST_DATA.NUMBER_ITEM}`);
    });

    it("should create composite key for boolean primitives", ({ expect }) => {
      const keyMap = new WeakMap();

      const result = generateStableKey(
        TEST_DATA.BOOLEAN_ITEM,
        TEST_DATA.INDEX_ZERO,
        keyMap,
      );

      expect(result).toBe(`${TEST_DATA.INDEX_ZERO}-${TEST_DATA.BOOLEAN_ITEM}`);
    });

    it("should create composite key for null and undefined", ({ expect }) => {
      const keyMap = new WeakMap();

      const nullResult = generateStableKey(null, TEST_DATA.INDEX_ZERO, keyMap);
      const undefinedResult = generateStableKey(
        undefined,
        TEST_DATA.INDEX_ZERO,
        keyMap,
      );

      expect(nullResult).toBe("0-null");
      expect(undefinedResult).toBe("0-undefined");
    });

    it("should not log warning when getKey is provided", ({ expect }) => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const keyMap = new WeakMap();
      const getKey = vi.fn().mockReturnValue("key");

      generateStableKey(
        TEST_DATA.OBJECT_ITEM,
        TEST_DATA.INDEX_ZERO,
        keyMap,
        getKey,
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should handle mixed item types in same keyMap", ({ expect }) => {
      const keyMap = new WeakMap();
      const object = { id: 1 };
      const array = [1, 2];

      const objectKey = generateStableKey(object, TEST_DATA.INDEX_ZERO, keyMap);
      const arrayKey = generateStableKey(array, TEST_DATA.INDEX_ZERO, keyMap);
      const stringKey = generateStableKey(
        TEST_DATA.STRING_ITEM,
        TEST_DATA.INDEX_ZERO,
        keyMap,
      );

      expect(objectKey).not.toBe(arrayKey);
      expect(arrayKey).not.toBe(stringKey);
      expect(keyMap.has(object)).toBe(true);
      expect(keyMap.has(array)).toBe(true);
    });

    it("should reuse UUID from keyMap on subsequent calls", ({ expect }) => {
      const keyMap = new WeakMap();
      const object = { id: 1 };

      const key1 = generateStableKey(object, TEST_DATA.INDEX_ZERO, keyMap);
      const key2 = generateStableKey(object, TEST_DATA.INDEX_FIVE, keyMap);
      const key3 = generateStableKey(object, 100, keyMap);

      expect(key1).toBe(key2);
      expect(key2).toBe(key3);
    });

    it("should preserve primitives without caching", ({ expect }) => {
      const keyMap = new WeakMap();

      const key1 = generateStableKey(
        TEST_DATA.STRING_ITEM,
        TEST_DATA.INDEX_ZERO,
        keyMap,
      );
      const key2 = generateStableKey(
        TEST_DATA.STRING_ITEM,
        TEST_DATA.INDEX_FIVE,
        keyMap,
      );

      expect(key1).not.toBe(key2);
      expect(key1).toBe("0-test-string");
      expect(key2).toBe("5-test-string");
    });

    it("should handle getKey returning undefined by converting to string", ({
      expect,
    }) => {
      const keyMap = new WeakMap();
      const getKey = vi.fn().mockReturnValue(undefined);

      const result = generateStableKey(
        TEST_DATA.OBJECT_ITEM,
        TEST_DATA.INDEX_ZERO,
        keyMap,
        getKey,
      );

      expect(result).toBe("undefined");
    });

    it("should handle deeply nested objects", ({ expect }) => {
      const keyMap = new WeakMap();
      const deepObject = {
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
      };

      const key1 = generateStableKey(deepObject, TEST_DATA.INDEX_ZERO, keyMap);
      const key2 = generateStableKey(deepObject, TEST_DATA.INDEX_FIVE, keyMap);

      expect(key1).toBe(key2);
    });

    it("should handle objects with circular references", ({ expect }) => {
      const keyMap = new WeakMap();
      const circular = castAsType<{ value: string; self?: unknown }>({
        value: "circular",
      });

      circular.self = circular;

      const key1 = generateStableKey(circular, TEST_DATA.INDEX_ZERO, keyMap);
      const key2 = generateStableKey(circular, TEST_DATA.INDEX_FIVE, keyMap);

      expect(key1).toBe(key2);
    });

    it("should fall through to composite key when keyMap.get returns falsy", ({
      expect,
    }) => {
      const keyMap = {
        has: vi.fn().mockReturnValue(true),
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
      } as unknown as WeakMap<WeakKey, string>;

      const object = { id: 1, name: "test" };

      const result = generateStableKey(object, 5, keyMap);

      // When keyMap.get returns falsy, it should fall through to composite key
      expect(result).toBe("5-[object Object]");
      expect(keyMap.has).toHaveBeenCalledWith(object);
      expect(keyMap.get).toHaveBeenCalledWith(object);
    });
  });
});
