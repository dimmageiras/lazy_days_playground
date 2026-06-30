import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TIMING_IN_S } from "@shared/constants/timing.constant";

import { DateHelper } from "./date.helper";

const {
  sharedTestData: { COMMON_DATE },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("date.helper");

const { DAYS_ONE, MINUTES_FIVE: FIVE_MIN_S, MINUTES_ONE } = TIMING_IN_S;

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
  DISPLAY_HOUR_CASES: [
    {
      date: new Date(`${COMMON_DATE}T00:00:00.000Z`),
      expected: "12 am",
      name: "should format midnight as 12 am",
    },
    {
      date: new Date(`${COMMON_DATE}T12:00:00.000Z`),
      expected: "12 pm",
      name: "should format noon as 12 pm",
    },
    {
      date: new Date(`${COMMON_DATE}T15:00:00.000Z`),
      expected: "3 pm",
      name: "should format an afternoon hour as h pm",
    },
    {
      date: new Date(`${COMMON_DATE}T01:00:00.000Z`),
      expected: "1 am",
      name: "should format an early-morning hour without leading zero",
    },
  ],
  EXPECTED_FORMATTED_TIMESTAMP: `${COMMON_DATE} 15:00:00 UTC`,
  EXPECTED_LOCAL_TIMESTAMP_SHAPE:
    /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2} [AP]M$/,
  FUTURE_DATE_CASES: [
    {
      expected: `${COMMON_DATE}T15:05:00.000Z`,
      maxAgeSeconds: FIVE_MIN_S,
      name: "should offset by five minutes",
    },
    {
      expected: `${COMMON_DATE}T15:01:00.000Z`,
      maxAgeSeconds: MINUTES_ONE,
      name: "should offset by sixty seconds",
    },
    {
      expected: "2025-01-02T15:00:00.000Z",
      maxAgeSeconds: DAYS_ONE,
      name: "should offset by one day",
    },
  ],
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
    TEST_DATA.FUTURE_DATE_CASES.forEach(({ name, maxAgeSeconds, expected }) => {
      it(name, ({ expect }) => {
        const result = getFutureDate(maxAgeSeconds).toISOString();

        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("toDisplayHour", (it) => {
    TEST_DATA.DISPLAY_HOUR_CASES.forEach(({ name, date, expected }) => {
      it(name, ({ expect }) => {
        const result = toDisplayHour(date);

        expect(result).toStrictEqual(expected);
      });
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
