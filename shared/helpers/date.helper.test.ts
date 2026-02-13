import dayjs from "dayjs";
import { describe } from "vitest";

import { DateHelper } from "./date.helper";

const {
  formatHourForDisplay,
  formatTimestampForDisplay,
  formatTimestampLocal,
  getCurrentISOTimestamp,
  getCurrentUTCDate,
  getFutureUTCDate,
  toISOTimestamp,
} = DateHelper;

const TEST_DATA = {
  DATE: new Date("2025-01-03T15:00:00.000Z"),
  MAX_AGE: 300,
} as const;

// Factory function to create consistent test date
const getTestDate = () => TEST_DATA.DATE;

describe("DateHelper", () => {
  describe("formatHourForDisplay", (it) => {
    it("should format the hour for display", ({ expect }) => {
      const result = formatHourForDisplay(getTestDate());

      expect(result).toStrictEqual("3 pm");
    });
  });

  describe("formatTimestampForDisplay", (it) => {
    it("should format the timestamp for display", ({ expect }) => {
      const result = formatTimestampForDisplay(getTestDate());

      expect(result).toStrictEqual("2025-01-03 15:00:00 UTC");
    });
  });

  describe("formatTimestampLocal", (it) => {
    it("should format the timestamp for local display", ({ expect }) => {
      const result = formatTimestampLocal(getTestDate());

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
      const result = getCurrentUTCDate().toISOString().slice(0, 19);

      expect(result).toStrictEqual(new Date().toISOString().slice(0, 19));
    });
  });

  describe("getFutureUTCDate", (it) => {
    it("should get the future UTC date", ({ expect }) => {
      const result = getFutureUTCDate(TEST_DATA.MAX_AGE)
        .toISOString()
        .slice(0, 19);

      expect(result).toStrictEqual(
        dayjs()
          .utc()
          .add(TEST_DATA.MAX_AGE, "seconds")
          .toDate()
          .toISOString()
          .slice(0, 19),
      );
    });
  });

  describe("toISOTimestamp", (it) => {
    it("should convert a date to an ISO timestamp", ({ expect }) => {
      const result = toISOTimestamp(getTestDate());

      expect(result).toStrictEqual(TEST_DATA.DATE.toISOString());
    });
  });
});
