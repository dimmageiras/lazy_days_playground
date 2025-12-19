import type { KeyAsString } from "type-fest";
import { describe, it } from "vitest";

import { MODES } from "@shared/constants/root-env.constant";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

import { RootEnvHelper } from "./root-env.helper";

const {
  DEVELOPMENT: DEVELOPMENT_MODE,
  PRODUCTION: PRODUCTION_MODE,
  TYPE_GENERATOR: TYPE_GENERATOR_MODE,
} = MODES;

const { getObjectKeys } = ObjectUtilsHelper;
const { getMode } = RootEnvHelper;

// Test data constants
const TEST_CASES = {
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
const testGetMode = (key: KeyAsString<typeof TEST_CASES>) => {
  const testCase = Reflect.get(TEST_CASES, key);
  const { isDevelopment, isTypeGeneratorMode, expected } = testCase;

  it(`should return ${key.toLowerCase()} mode when isDevelopment is ${isDevelopment} and isTypeGeneratorMode is ${isTypeGeneratorMode}`, ({
    expect,
  }) => {
    expect(getMode(isDevelopment, isTypeGeneratorMode)).toBe(expected);
  });
};

describe("RootEnvHelper", () => {
  describe("getMode", () => {
    getObjectKeys(TEST_CASES).forEach(testGetMode);
  });
});
