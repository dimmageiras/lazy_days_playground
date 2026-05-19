import { VitestSetup } from "@configs/vitest/setup";
import { beforeEach, describe, vi } from "vitest";

import { TIMING_IN_S } from "../constants/timing.constant";
import { DateHelper } from "./date.helper";

const { trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("date.helper");

const { MINUTES_FIVE } = TIMING_IN_S;

const {
  getCurrentISOTimestamp,
  getCurrentTimestamp,
  getCurrentUTCDate,
  getFutureUTCDate,
  toDisplayHour,
  toDisplayTimestamp,
  toISOTimestamp,
  toLocalTimestamp,
} = DateHelper;

const TEST_DATA = {
  DATE: new Date("2025-01-03T15:00:00.000Z"),
  DATE_AS_ISO: "2025-01-03T15:00:00.000Z",
  EXPECTED_FORMATTED_HOUR: "3 pm",
  EXPECTED_FORMATTED_TIMESTAMP: "2025-01-03 15:00:00 UTC",
  EXPECTED_FUTURE_ISO: "2025-01-03T15:05:00.000Z",
  EXPECTED_LOCAL_SHAPE: /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2} [AP]M$/,
  EXPECTED_TIMESTAMP_MS: new Date("2025-01-03T15:00:00.000Z").getTime(),
  FIXED_NOW: "2025-01-03T15:00:00.000Z",
  MAX_AGE: MINUTES_FIVE,
} as const;

describe("DateHelper", () => {
  beforeEach(({ onTestFinished }) => {
    vi.setSystemTime(new Date(TEST_DATA.FIXED_NOW));

    onTestFinished(() => {
      vi.useRealTimers();
    });
  });

  describe("getCurrentISOTimestamp", (it) => {
    it("should get the current ISO timestamp", ({ expect }) => {
      const result = getCurrentISOTimestamp();

      expect(result).toStrictEqual(TEST_DATA.FIXED_NOW);
    });
  });

  describe("getCurrentTimestamp", (it) => {
    it("should get the current timestamp in milliseconds since the epoch", ({
      expect,
    }) => {
      const result = getCurrentTimestamp();

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_TIMESTAMP_MS);
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

  describe("toDisplayHour", (it) => {
    it("should format the hour for display", ({ expect }) => {
      const result = toDisplayHour(TEST_DATA.DATE);

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_FORMATTED_HOUR);
    });
  });

  describe("toDisplayTimestamp", (it) => {
    it("should format the timestamp for display", ({ expect }) => {
      const result = toDisplayTimestamp(TEST_DATA.DATE);

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_FORMATTED_TIMESTAMP);
    });
  });

  describe("toISOTimestamp", (it) => {
    it("should convert a date to an ISO timestamp", ({ expect }) => {
      const result = toISOTimestamp(TEST_DATA.DATE);

      expect(result).toStrictEqual(TEST_DATA.DATE_AS_ISO);
    });
  });

  describe("toLocalTimestamp", (it) => {
    it("should format the timestamp for local display", ({ expect }) => {
      // Shape-match (MM/DD/YYYY, hh:mm:ss A) instead of value — the helper
      // formats in local tz, so CI machines on different zones would diverge.
      const result = toLocalTimestamp(TEST_DATA.DATE);

      expect(result).toMatch(TEST_DATA.EXPECTED_LOCAL_SHAPE);
    });
  });
});
