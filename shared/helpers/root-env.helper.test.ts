import type { KeyAsString } from "type-fest";
import type { TestAPI } from "vitest";
import { describe, vi } from "vitest";

import { MODES } from "@shared/constants/root-env.constant";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

import { RootEnvHelper } from "./root-env.helper";

const {
  DEVELOPMENT: DEVELOPMENT_MODE,
  PRODUCTION: PRODUCTION_MODE,
  TYPE_GENERATOR: TYPE_GENERATOR_MODE,
} = MODES;

const { getObjectKeys } = ObjectUtilsHelper;
const { getEnvVariables, getMode } = RootEnvHelper;

// Test data constants
const TEST_DATA = {
  DEVELOPMENT: {
    isDevelopment: true,
    isTypeGeneratorMode: false,
    expected: DEVELOPMENT_MODE,
  },
  PRODUCTION: {
    isDevelopment: false,
    isTypeGeneratorMode: false,
    expected: PRODUCTION_MODE,
  },
  TYPE_GENERATOR: {
    isDevelopment: false,
    isTypeGeneratorMode: true,
    expected: TYPE_GENERATOR_MODE,
  },
} as const;

// Test helper function to test getMode
const testGetMode = (key: KeyAsString<typeof TEST_DATA>, it: TestAPI) => {
  const testCase = Reflect.get(TEST_DATA, key);
  const { isDevelopment, isTypeGeneratorMode, expected } = testCase;

  it(`should return ${key.toLowerCase()} mode when isDevelopment is ${isDevelopment} and isTypeGeneratorMode is ${isTypeGeneratorMode}`, ({
    expect,
  }) => {
    expect(getMode(isDevelopment, isTypeGeneratorMode)).toBe(expected);
  });
};

describe("RootEnvHelper", () => {
  describe("getEnvVariables", (it) => {
    it("should return import.meta.env when process is not available", ({
      expect,
    }) => {
      const originalProcess = globalThis.process;

      vi.stubGlobal("process", undefined);

      try {
        const result = getEnvVariables();

        expect(result).toBe(import.meta.env);
      } finally {
        vi.stubGlobal("process", originalProcess);
      }
    });

    it("should throw when process and import.meta.env are not available", ({
      expect,
    }) => {
      const originalProcess = globalThis.process;

      vi.stubGlobal("process", undefined);
      vi.spyOn(ObjectUtilsHelper, "isObject").mockReturnValue(false);

      try {
        expect(() => getEnvVariables()).toThrow(
          "Environment variables are not available",
        );
      } finally {
        vi.stubGlobal("process", originalProcess);
        vi.restoreAllMocks();
      }
    });
  });

  describe("getMode", (it) => {
    getObjectKeys(TEST_DATA).forEach((key) => testGetMode(key, it));
  });
});
