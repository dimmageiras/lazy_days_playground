import { VitestSetup } from "@configs/vitest/setup";
import { afterAll, beforeAll, describe, vi } from "vitest";

import { TIMING_IN_MS, TIMING_IN_S } from "../constants/timing.constant";
import { DateHelper } from "./date.helper";
import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("date.helper");

const { MINUTES_FIVE: FIVE_MIN_MS } = TIMING_IN_MS;
const { MINUTES_FIVE: FIVE_MIN_S } = TIMING_IN_S;

const { castAsType } = TypesHelper;

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
  EXPECTED_TIMESTAMP_MS: new Date("2025-01-03T15:00:00.000Z").getTime(),
  FIXED_NOW: "2025-01-03T15:00:00.000Z",
  FUTURE_DATE_CASES: [
    {
      expected: new Date(
        new Date("2025-01-03T15:00:00.000Z").getTime() + FIVE_MIN_MS,
      ).toISOString(),
      name: "should offset by five minutes (300s)",
      offset: FIVE_MIN_S,
    },
    {
      expected: new Date(
        new Date("2025-01-03T15:00:00.000Z").getTime() + 60_000,
      ).toISOString(),
      name: "should offset by sixty seconds",
      offset: 60,
    },
    {
      expected: new Date(
        new Date("2025-01-03T15:00:00.000Z").getTime() + 86_400_000,
      ).toISOString(),
      name: "should offset by one day (86_400s)",
      offset: 86_400,
    },
  ],
  TZ_UTC: "UTC",
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
    TEST_DATA.FUTURE_DATE_CASES.forEach(({ name, offset, expected }) => {
      it(name, ({ expect }) => {
        const result = getFutureDate(
          castAsType<(typeof TIMING_IN_S)[keyof typeof TIMING_IN_S]>(offset),
        ).toISOString();

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
      // Shape-match (MM/DD/YYYY, hh:mm:ss A) instead of value — the helper
      // formats in local tz, so CI machines on different zones would diverge.
      const result = toLocalTimestamp(TEST_DATA.DATE);

      expect(result).toMatch(TEST_DATA.EXPECTED_LOCAL_TIMESTAMP_SHAPE);
    });
  });
});
