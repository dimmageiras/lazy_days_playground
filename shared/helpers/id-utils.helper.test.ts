import { validate as uuidValidate, version as uuidVersion } from "uuid";
import { describe, vi } from "vitest";

import { IdUtilsHelper } from "./id-utils.helper";
import { TypeHelper } from "./type.helper";

const { fastIdGen, isSecureId, secureIdGen } = IdUtilsHelper;
const { castAsType } = TypeHelper;

// Test data constants
const TEST_DATA = {
  V4: "550e8400-e29b-41d4-a716-446655440000",
  V7: "0192a8b2-c9e3-7f4a-8b5c-123456789abc",
  INVALID_V4: "550e8400-e29b-41d4-a716-44665544000", // Too short
  INVALID_FORMAT: "not-a-uuid-at-all",
  V7_WRONG_VERSION: "550e8400-e29b-41d4-a716-446655440000", // V4 UUID
} as const;

// Mock only the generation functions for predictable test results
vi.mock("uuid", () => ({
  v4: vi.fn(() => TEST_DATA.V4), // Mock v4 for consistency
  v7: vi.fn(() => TEST_DATA.V7), // Mock v7 for consistency
  validate: vi.fn((id: string) => {
    // Custom UUID validation logic inline to avoid circular dependency
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-57][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return typeof id === "string" && uuidRegex.test(id);
  }),
  version: vi.fn((id: string) => {
    // Custom UUID version detection logic inline to avoid circular dependency
    if (typeof id !== "string" || !id.includes("-")) {
      return null;
    }

    const parts = id.split("-");

    if (parts.length !== 5) {
      return null;
    }

    const versionChar = parts[2]?.[0];

    return versionChar ? Number.parseInt(versionChar, 16) : null;
  }),
}));

describe("IdUtilsHelper", () => {
  describe("fastIdGen", (it) => {
    it("should generate a valid UUID v4", ({ expect }) => {
      const result = fastIdGen();

      expect(result).toBe(TEST_DATA.V4);
      expect(uuidValidate(result)).toBe(true);
      expect(uuidVersion(result)).toBe(4);
    });
  });

  describe("secureIdGen", (it) => {
    it("should generate a valid UUID v7", ({ expect }) => {
      const result = secureIdGen();

      expect(result).toBe(TEST_DATA.V7);
      expect(uuidValidate(result)).toBe(true);
      expect(uuidVersion(result)).toBe(7);
    });
  });

  describe("isSecureId", (it) => {
    it("should return true for valid UUID v7", ({ expect }) => {
      const result = isSecureId(TEST_DATA.V7);

      expect(result).toBe(true);
    });

    it("should return false for valid UUID v4", ({ expect }) => {
      const result = isSecureId(TEST_DATA.V4);

      expect(result).toBe(false);
    });

    it("should return false for invalid UUID format", ({ expect }) => {
      const result = isSecureId(TEST_DATA.INVALID_FORMAT);

      expect(result).toBe(false);
    });

    it("should return false for malformed UUID", ({ expect }) => {
      const result = isSecureId(TEST_DATA.INVALID_V4);

      expect(result).toBe(false);
    });

    it("should return false for non-string inputs", ({ expect }) => {
      expect(isSecureId(castAsType<string>(null))).toBe(false);
      expect(isSecureId(castAsType<string>(undefined))).toBe(false);
      expect(isSecureId(castAsType<string>(123))).toBe(false);
      expect(isSecureId(castAsType<string>({}))).toBe(false);
    });
  });
});
