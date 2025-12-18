import { describe } from "vitest";

import { MODES } from "@shared/constants/root-env.constant";

import { RootEnvHelper } from "./root-env.helper";

describe("RootEnvHelper", () => {
  describe("getMode", (it) => {
    const { getMode } = RootEnvHelper;

    it("should return type_generator mode when isDevelopment is false and isTypeGeneratorMode is true", ({
      expect,
    }) => {
      expect(getMode(false, true)).toBe(MODES.TYPE_GENERATOR);
    });

    it("should return development mode when isDevelopment is true and isTypeGeneratorMode is false", ({
      expect,
    }) => {
      expect(getMode(true, false)).toBe(MODES.DEVELOPMENT);
    });

    it("should return production mode when isDevelopment and isTypeGeneratorMode are false", ({
      expect,
    }) => {
      expect(getMode(false, false)).toBe(MODES.PRODUCTION);
    });
  });
});
