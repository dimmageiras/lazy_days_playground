import { afterEach, beforeEach, describe, vi } from "vitest";

import { TIMING_IN_S } from "../constants/timing.constant";
import { DateHelper } from "./date.helper";

const { MINUTES_FIVE } = TIMING_IN_S;

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
  DATE_AS_ISO: "2025-01-03T15:00:00.000Z",
  EXPECTED_FORMATTED_HOUR: "3 pm",
  EXPECTED_FORMATTED_TIMESTAMP: "2025-01-03 15:00:00 UTC",
  EXPECTED_FUTURE_ISO: "2025-01-03T15:05:00.000Z",
  EXPECTED_LOCAL_SHAPE: /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2} [AP]M$/,
  FIXED_NOW: "2025-01-03T15:00:00.000Z",
  MAX_AGE: MINUTES_FIVE,
} as const;

describe("DateHelper", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(TEST_DATA.FIXED_NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("formatHourForDisplay", (it) => {
    it("should format the hour for display", ({ expect }) => {
      const result = formatHourForDisplay(TEST_DATA.DATE);

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_FORMATTED_HOUR);
    });
  });

  describe("formatTimestampForDisplay", (it) => {
    it("should format the timestamp for display", ({ expect }) => {
      const result = formatTimestampForDisplay(TEST_DATA.DATE);

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_FORMATTED_TIMESTAMP);
    });
  });

  describe("formatTimestampLocal", (it) => {
    it("should format the timestamp in the MM/DD/YYYY, hh:mm:ss A shape", ({
      expect,
    }) => {
      const result = formatTimestampLocal(TEST_DATA.DATE);

      expect(result).toMatch(TEST_DATA.EXPECTED_LOCAL_SHAPE);
    });
  });

  describe("getCurrentISOTimestamp", (it) => {
    it("should get the current ISO timestamp", ({ expect }) => {
      const result = getCurrentISOTimestamp();

      expect(result).toStrictEqual(TEST_DATA.FIXED_NOW);
    });
  });

  describe("getCurrentUTCDate", (it) => {
    it("should get the current UTC date", ({ expect }) => {
      const result = getCurrentUTCDate();

      expect(result.toISOString()).toStrictEqual(TEST_DATA.FIXED_NOW);
    });
  });

  describe("getFutureUTCDate", (it) => {
    it("should return a date offset by the given number of seconds", ({
      expect,
    }) => {
      const result = getFutureUTCDate(TEST_DATA.MAX_AGE).toISOString();

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_FUTURE_ISO);
    });
  });

  describe("toISOTimestamp", (it) => {
    it("should convert a date to an ISO timestamp", ({ expect }) => {
      const result = toISOTimestamp(TEST_DATA.DATE);

      expect(result).toStrictEqual(TEST_DATA.DATE_AS_ISO);
    });
  });
});
