import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TIMING_IN_S } from "@shared/constants/timing.constant";

import { DateHelper } from "./date.helper";

const {
  sharedTestData: { COMMON_DATE },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("date.helper");

const { MINUTES_FIVE: FIVE_MIN_S } = TIMING_IN_S;

const {
  getCurrentDate,
  getCurrentISOTimestamp,
  getCurrentTimestamp,
  getFutureDate,
  toDisplayHour,
  toDisplayTimestamp,
  toISOTimestamp,
  toLocalTimestamp,
} = DateHelper;

const TEST_DATA = {
  DATE_AS_ISO: `${COMMON_DATE}T15:00:00.000Z`,
  DISPLAY_HOUR: "3 pm",
  EXPECTED_FORMATTED_TIMESTAMP: `${COMMON_DATE} 15:00:00 UTC`,
  EXPECTED_LOCAL_TIMESTAMP_SHAPE:
    /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2} [AP]M$/,
  FUTURE_DATE: `${COMMON_DATE}T15:05:00.000Z`,
} as const;

describe("DateHelper", ({ afterAll, beforeAll }) => {
  const testDate = new Date(TEST_DATA.DATE_AS_ISO);

  beforeAll(() => {
    vi.setSystemTime(testDate);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("getCurrentDate", (it) => {
    it("should get the current date", ({ expect }) => {
      const result = getCurrentDate();

      expect(result.toISOString()).toStrictEqual(TEST_DATA.DATE_AS_ISO);
    });
  });

  describe("getCurrentISOTimestamp", (it) => {
    it("should get the current ISO timestamp", ({ expect }) => {
      const result = getCurrentISOTimestamp();

      expect(result).toStrictEqual(TEST_DATA.DATE_AS_ISO);
    });
  });

  describe("getCurrentTimestamp", (it) => {
    it("should get the current timestamp in milliseconds since the epoch", ({
      expect,
    }) => {
      const result = getCurrentTimestamp();

      expect(result).toStrictEqual(testDate.getTime());
    });
  });

  describe("getFutureDate", (it) => {
    it("should offset the current date by the given seconds", ({ expect }) => {
      const result = getFutureDate(FIVE_MIN_S).toISOString();

      expect(result).toStrictEqual(TEST_DATA.FUTURE_DATE);
    });
  });

  describe("toDisplayHour", (it) => {
    it("should format an afternoon hour as h pm", ({ expect }) => {
      const result = toDisplayHour(testDate);

      expect(result).toStrictEqual(TEST_DATA.DISPLAY_HOUR);
    });
  });

  describe("toDisplayTimestamp", (it) => {
    it("should format the timestamp for display", ({ expect }) => {
      const result = toDisplayTimestamp(testDate);

      expect(result).toStrictEqual(TEST_DATA.EXPECTED_FORMATTED_TIMESTAMP);
    });
  });

  describe("toISOTimestamp", (it) => {
    it("should convert a date to an ISO timestamp", ({ expect }) => {
      const result = toISOTimestamp(testDate);

      expect(result).toStrictEqual(TEST_DATA.DATE_AS_ISO);
    });
  });

  describe("toLocalTimestamp", (it) => {
    it("should format the timestamp for local display", ({ expect }) => {
      const result = toLocalTimestamp(testDate);

      expect(result).toMatch(TEST_DATA.EXPECTED_LOCAL_TIMESTAMP_SHAPE);
    });
  });
});
