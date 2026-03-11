import { createHash } from "node:crypto";
import { describe, it } from "vitest";

import { IdUtilsServerHelper } from "./id-utils.helper";

const { sixDigitCodeGen } = IdUtilsServerHelper;

describe("IdUtilsServerHelper", () => {
  describe("sixDigitCodeGenOnServer", () => {
    it("should generate a valid 6 digit code and hash", ({ expect }) => {
      const result = sixDigitCodeGen();
      const hash = createHash("sha256").update(result.code).digest();

      expect(result.code).toMatch(/^\d{6}$/);
      expect(result.hash).toBeInstanceOf(Buffer);
      expect(result.hash.length).toBe(32);
      expect(result.hash.toString("hex")).toBe(hash.toString("hex"));
    });
  });
});
