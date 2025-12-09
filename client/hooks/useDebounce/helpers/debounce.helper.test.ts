import { describe, vi } from "vitest";

import { DebounceHelper } from "./debounce.helper";

describe("DebounceHelper", () => {
  describe("safeApplyCallback", (it) => {
    it("calls the callback when it is a function", ({ expect }) => {
      const mockCallback = vi.fn();
      const args = ["arg1", 42, { key: "value" }];

      DebounceHelper.safeApplyCallback(mockCallback, args);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(...args);
    });

    it("does not call the callback when it is undefined", ({ expect }) => {
      const mockCallback = vi.fn();

      DebounceHelper.safeApplyCallback(undefined, []);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("passes empty arguments array correctly", ({ expect }) => {
      const mockCallback = vi.fn();

      DebounceHelper.safeApplyCallback(mockCallback, []);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith();
    });

    it("passes multiple arguments correctly", ({ expect }) => {
      const mockCallback = vi.fn();
      const args = ["string", 123, true, null, undefined, { obj: "value" }];

      DebounceHelper.safeApplyCallback(mockCallback, args);

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(...args);
    });

    it("works with async callbacks", async ({ expect }) => {
      const mockAsyncCallback = vi.fn().mockResolvedValue("result");

      DebounceHelper.safeApplyCallback(mockAsyncCallback, []);

      expect(mockAsyncCallback).toHaveBeenCalledTimes(1);
      expect(mockAsyncCallback).toHaveBeenCalledWith();
    });

    it("handles callbacks that throw errors", ({ expect }) => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error("Test error");
      });

      expect(() => {
        DebounceHelper.safeApplyCallback(errorCallback, []);
      }).toThrow("Test error");

      expect(errorCallback).toHaveBeenCalledTimes(1);
    });
  });
});
