import { describe } from "vitest";

import { API_MUTATING_METHODS } from "../constants/api.constant";
import { ApiHelper } from "./api.helper";

const { isMutatingMethod } = ApiHelper;

describe("ApiHelper", () => {
  describe("isMutatingMethod", (it) => {
    [...API_MUTATING_METHODS].forEach((method) => {
      it(`should return true for ${method}`, ({ expect }) => {
        expect(isMutatingMethod(method)).toBe(true);
      });
    });

    it("should return false for a non-mutating method", ({ expect }) => {
      expect(isMutatingMethod("GET")).toBe(false);
    });
  });
});
