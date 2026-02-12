import { describe } from "vitest";

import { DateHelper } from "./date.helper";

const {
  formatHourForDisplay,
  formatTimestampForDisplay,
  formatTimestampLocal,
  getCurrentISOTimestamp,
  getCurrentUTCDate,
  toISOTimestamp,
} = DateHelper;

const TEST_DATA = {
  DATE: new Date("2025-01-03T15:00:00.000Z"),
} as const;

describe("DateHelper", () => {
  describe("formatHourForDisplay", (it) => {
    it("should format the hour for display", ({ expect }) => {
      const date = TEST_DATA.DATE;
      const result = formatHourForDisplay(date);

      expect(result).toStrictEqual("3 pm");
    });
  });

  describe("formatTimestampForDisplay", (it) => {
    it("should format the timestamp for display", ({ expect }) => {
      const date = TEST_DATA.DATE;
      const result = formatTimestampForDisplay(date);

      expect(result).toStrictEqual("2025-01-03 15:00:00 UTC");
    });
  });

  describe("formatTimestampLocal", (it) => {
    it("should format the timestamp for local display", ({ expect }) => {
      const date = TEST_DATA.DATE;
      const result = formatTimestampLocal(date);

      expect(result).toStrictEqual(
        TEST_DATA.DATE.toLocaleString("en-US", {
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          month: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
          year: "numeric",
        }),
      );
    });
  });

  describe("getCurrentISOTimestamp", (it) => {
    it("should get the current ISO timestamp", ({ expect }) => {
      const result = getCurrentISOTimestamp();

      expect(result.slice(0, 19)).toStrictEqual(
        new Date().toISOString().slice(0, 19),
      );
    });
  });

  describe("getCurrentUTCDate", (it) => {
    it("should get the current UTC date", ({ expect }) => {
      const result = getCurrentUTCDate();

      expect(result).toStrictEqual(new Date());
    });
  });

  describe("toISOTimestamp", (it) => {
    it("should convert a date to an ISO timestamp", ({ expect }) => {
      const date = TEST_DATA.DATE;
      const result = toISOTimestamp(date);

      expect(result).toStrictEqual(TEST_DATA.DATE.toISOString());
    });
  });
});
