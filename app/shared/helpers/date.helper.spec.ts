import { afterAll, beforeAll, describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TIMING_IN_S } from "@shared/constants/timing.constant";

import { DateHelper } from "./date.helper";

const { trackLeaksInSpec }: Awaited<ReturnType<typeof VitestSetup>> =
  await VitestSetup();

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
  DATE: new Date("2025-01-03T15:00:00.000Z"),
  DATE_AS_ISO: "2025-01-03T15:00:00.000Z",
  DISPLAY_HOUR_CASES: [
    {
      expected: "12 am",
      input: new Date("2025-01-03T00:00:00.000Z"),
      name: "should format midnight as 12 am",
    },
    {
      expected: "12 pm",
      input: new Date("2025-01-03T12:00:00.000Z"),
      name: "should format noon as 12 pm",
    },
    {
      expected: "3 pm",
      input: new Date("2025-01-03T15:00:00.000Z"),
      name: "should format afternoon hour as h pm",
    },
    {
      expected: "1 am",
      input: new Date("2025-01-03T01:00:00.000Z"),
      name: "should format early-morning hour without leading zero",
    },
  ],
  EXPECTED_FORMATTED_TIMESTAMP: "2025-01-03 15:00:00 UTC",
  EXPECTED_LOCAL_TIMESTAMP_SHAPE:
    /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2} [AP]M$/,
  EXPECTED_TIMESTAMP_MS: 1735916400000,
  FIXED_NOW: "2025-01-03T15:00:00.000Z",
  FUTURE_DATE_CASES: [
    {
      expected: "2025-01-03T15:05:00.000Z",
      maxAgeSeconds: FIVE_MIN_S,
      name: "should offset by five minutes (300s)",
    },
    {
      expected: "2025-01-03T15:01:00.000Z",
      maxAgeSeconds: MINUTES_ONE,
      name: "should offset by sixty seconds",
    },
    {
      expected: "2025-01-04T15:00:00.000Z",
      maxAgeSeconds: DAYS_ONE,
      name: "should offset by one day (86_400s)",
    },
  ],
} as const;

describe("DateHelper", () => {
  beforeAll(() => {
    vi.setSystemTime(new Date(TEST_DATA.FIXED_NOW));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("getCurrentDate", (it) => {
    it("should get the current date", ({ expect }) => {
      const result = getCurrentDate();

      expect(result.toISOString()).toStrictEqual(TEST_DATA.FIXED_NOW);
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

  describe("getFutureDate", (it) => {
    TEST_DATA.FUTURE_DATE_CASES.forEach(({ name, maxAgeSeconds, expected }) => {
      it(name, ({ expect }) => {
        const result = getFutureDate(maxAgeSeconds).toISOString();

        expect(result).toStrictEqual(expected);
      });
    });
  });

  describe("toDisplayHour", (it) => {
    TEST_DATA.DISPLAY_HOUR_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        const result = toDisplayHour(input);

        expect(result).toStrictEqual(expected);
      });
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
      const result = toLocalTimestamp(TEST_DATA.DATE);

      expect(result).toMatch(TEST_DATA.EXPECTED_LOCAL_TIMESTAMP_SHAPE);
    });
  });
});
