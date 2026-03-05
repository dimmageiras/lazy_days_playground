import { describe } from "vitest";

import { TypeHelper } from "@shared/helpers/type.helper";

import { CredentialsHelper } from "./credentials.helper";

const { maskDsnCredentials } = CredentialsHelper;
const { castAsType } = TypeHelper;

// Test data constants
const TEST_DATA = {
  DSN_NO_COLON: "gel://user@localhost:5432/database",
  DSN_NO_CREDENTIALS: "gel://localhost:5432/database",
  DSN_NO_PROTOCOL: "user:password@localhost:5432/database",
  DSN_NUMBER: 123,
  DSN: "gel://user:password@localhost:5432/database",
  MASKED_DSN_NO_COLON: "gel://****@localhost:5432/database",
  MASKED_DSN: "gel://user:********@localhost:5432/database",
} as const;

describe("CredentialsHelper", () => {
  describe("maskDsnCredentials", (it) => {
    it("should mask the DSN credentials", ({ expect }) => {
      const result = maskDsnCredentials(TEST_DATA.DSN);

      expect(result).toBe(TEST_DATA.MASKED_DSN);
    });

    it("should return the DSN if it has no credentials", ({ expect }) => {
      const result = maskDsnCredentials(TEST_DATA.DSN_NO_CREDENTIALS);

      expect(result).toBe(TEST_DATA.DSN_NO_CREDENTIALS);
    });

    it("should return the DSN if it has no protocol", ({ expect }) => {
      const result = maskDsnCredentials(TEST_DATA.DSN_NO_PROTOCOL);

      expect(result).toBe(TEST_DATA.DSN_NO_PROTOCOL);
    });

    it("should return the DSN if DSN is a number", ({ expect }) => {
      const result = maskDsnCredentials(
        castAsType<string>(TEST_DATA.DSN_NUMBER),
      );

      expect(result).toBe(TEST_DATA.DSN_NUMBER);
    });

    it("should return 'undefined' if DSN is undefined", ({ expect }) => {
      const result = maskDsnCredentials(castAsType<string>(undefined));

      expect(result).toBe("undefined");
    });

    it("should mask the entire DSN credentials if it has no colon", ({
      expect,
    }) => {
      const result = maskDsnCredentials(TEST_DATA.DSN_NO_COLON);

      expect(result).toBe(TEST_DATA.MASKED_DSN_NO_COLON);
    });
  });
});
