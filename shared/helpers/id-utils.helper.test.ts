import { validate as uuidValidate, version as uuidVersion } from "uuid";
import { describe, vi } from "vitest";

import { IdUtilsHelper } from "./id-utils.helper";

// Mock only the generation functions for predictable test results
vi.mock("uuid", () => ({
  v4: vi.fn(() => "550e8400-e29b-41d4-a716-446655440000"), // Mock v4 for consistency
  v7: vi.fn(() => "0192a8b2-c9e3-7f4a-8b5c-123456789abc"), // Mock v7 for consistency
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
    it("returns a string", ({ expect }) => {
      const result = IdUtilsHelper.fastIdGen();

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns a valid UUID v4", ({ expect }) => {
      const result = IdUtilsHelper.fastIdGen();

      expect(uuidValidate(result)).toBe(true);
      expect(uuidVersion(result)).toBe(4);
    });

    it("returns the mocked UUID v4 for consistency", ({ expect }) => {
      const result = IdUtilsHelper.fastIdGen();

      expect(result).toBe("550e8400-e29b-41d4-a716-446655440000");
    });
  });

  describe("secureIdGen", (it) => {
    it("returns a string", ({ expect }) => {
      const result = IdUtilsHelper.secureIdGen();

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns a valid UUID v7", ({ expect }) => {
      const result = IdUtilsHelper.secureIdGen();

      expect(uuidValidate(result)).toBe(true);
      expect(uuidVersion(result)).toBe(7);
    });

    it("returns the mocked UUID v7 for consistency", ({ expect }) => {
      const result = IdUtilsHelper.secureIdGen();

      expect(result).toBe("0192a8b2-c9e3-7f4a-8b5c-123456789abc");
    });
  });

  describe("isSecureId", (it) => {
    it("returns true for valid UUID v7", ({ expect }) => {
      const validV7Id = "0192a8b2-c9e3-7f4a-8b5c-123456789abc"; // Real v7 UUID

      const result = IdUtilsHelper.isSecureId(validV7Id);

      expect(result).toBe(true);
    });

    it("returns true for the mocked secure ID", ({ expect }) => {
      const mockedSecureId = IdUtilsHelper.secureIdGen();

      const result = IdUtilsHelper.isSecureId(mockedSecureId);

      expect(result).toBe(true);
    });

    it("returns false for UUID v4", ({ expect }) => {
      const v4Id = "550e8400-e29b-41d4-a716-446655440000"; // The mocked v4 UUID

      const result = IdUtilsHelper.isSecureId(v4Id);

      expect(result).toBe(false);
    });

    it("returns false for invalid UUID strings", ({ expect }) => {
      const invalidIds = [
        "not-a-uuid",
        "12345",
        "",
        "invalid-uuid-format",
        "12345678-1234-1234-1234-123456789abc-invalid",
      ];

      invalidIds.forEach((id) => {
        expect(IdUtilsHelper.isSecureId(id)).toBe(false);
      });
    });

    it("handles UUIDs with different cases", ({ expect }) => {
      const upperCaseId = "0192A8B2-C9E3-7F4A-8B5C-123456789ABC";
      const lowerCaseId = "0192a8b2-c9e3-7f4a-8b5c-123456789abc";

      // UUID validation is case insensitive
      expect(IdUtilsHelper.isSecureId(upperCaseId)).toBe(true);
      expect(IdUtilsHelper.isSecureId(lowerCaseId)).toBe(true);
    });

    it("returns false for other UUID versions", ({ expect }) => {
      // Test with hardcoded UUIDs of different versions
      const v1Id = "12345678-1234-1123-8123-123456789abc"; // Version 1
      const v3Id = "12345678-1234-3123-8123-123456789abc"; // Version 3
      const v4Id = "550e8400-e29b-41d4-a716-446655440000"; // Version 4 (mocked)
      const v5Id = "12345678-1234-5123-8123-123456789abc"; // Version 5

      expect(IdUtilsHelper.isSecureId(v1Id)).toBe(false);
      expect(IdUtilsHelper.isSecureId(v3Id)).toBe(false);
      expect(IdUtilsHelper.isSecureId(v4Id)).toBe(false);
      expect(IdUtilsHelper.isSecureId(v5Id)).toBe(false);
    });

    it("integrates correctly with secureIdGen output", ({ expect }) => {
      const generatedId = IdUtilsHelper.secureIdGen();
      const isSecure = IdUtilsHelper.isSecureId(generatedId);

      expect(isSecure).toBe(true);
      expect(uuidValidate(generatedId)).toBe(true);
      expect(uuidVersion(generatedId)).toBe(7);
    });
  });
});
