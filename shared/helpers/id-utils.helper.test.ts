import { validate as uuidValidate, version as uuidVersion } from "uuid";
import { describe } from "vitest";

import { IdUtilsHelper } from "./id-utils.helper";

const { fastIdGen, isSecureId, secureIdGen } = IdUtilsHelper;

const TEST_DATA = {
  V4: "550e8400-e29b-41d4-a716-446655440000",
  V7: "0192a8b2-c9e3-7f4a-8b5c-123456789abc",
} as const;

describe("IdUtilsHelper", () => {
  describe("fastIdGen", (it) => {
    it("should generate a valid UUID v4", ({ expect }) => {
      const result = fastIdGen();

      expect(uuidValidate(result)).toBe(true);
      expect(uuidVersion(result)).toBe(4);
    });
  });

  describe("isSecureId", (it) => {
    it("should return true for valid UUID v7", ({ expect }) => {
      const result = isSecureId(TEST_DATA.V7);

      expect(result).toBe(true);
    });

    it("should return false for invalid UUID v4", ({ expect }) => {
      const result = isSecureId(TEST_DATA.V4);

      expect(result).toBe(false);
    });
  });

  describe("secureIdGen", (it) => {
    it("should generate a valid UUID v7", ({ expect }) => {
      const result = secureIdGen();

      expect(uuidValidate(result)).toBe(true);
      expect(uuidVersion(result)).toBe(7);
    });
  });
});
