import { beforeEach, describe, vi } from "vitest";

import {
  createDayjsMock,
  DATE_EDGE_CASES,
  DATE_FORMAT_REGEX,
  MOCK_CURRENT_TIME,
  TEST_DATE_ISO,
  TEST_DATES,
} from "@shared/test-utils/test-data";

import { DateHelper } from "./date.helper";

// Mock dayjs using shared utility
vi.mock("dayjs", () => createDayjsMock());

// Mock the utc plugin
vi.mock("dayjs/plugin/utc.js", () => ({
  default: vi.fn(),
}));

describe("DateHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const {
    formatHourForDisplay,
    formatTimestampForDisplay,
    formatTimestampLocal,
    getCurrentISOTimestamp,
    getCurrentUTCDate,
    toISOTimestamp,
  } = DateHelper;

  describe("formatHourForDisplay", (it) => {
    it("formats ISO string to UTC hour display", ({ expect }) => {
      const result = formatHourForDisplay(TEST_DATES.iso);

      expect(result).toBe("3 pm");
    });

    it("formats timestamp number to UTC hour display", ({ expect }) => {
      const result = formatHourForDisplay(TEST_DATES.timestamp);

      expect(result).toBe("3 pm");
    });

    it("formats Date object to UTC hour display", ({ expect }) => {
      const result = formatHourForDisplay(TEST_DATES.dateObj);

      expect(result).toBe("3 pm");
    });

    it("formats midnight hour correctly", ({ expect }) => {
      const result = formatHourForDisplay(DATE_EDGE_CASES.midnight);

      expect(result).toBe("12 am");
    });

    it("formats noon hour correctly", ({ expect }) => {
      const result = formatHourForDisplay(DATE_EDGE_CASES.noon);

      expect(result).toBe("12 pm");
    });

    it("formats single digit hours correctly", ({ expect }) => {
      const morningDate = "2025-01-03T09:30:00.000Z";
      const result = formatHourForDisplay(morningDate);

      expect(result).toBe("9 am");
    });
  });

  describe("formatTimestampForDisplay", (it) => {
    it("formats ISO string to UTC timestamp display", ({ expect }) => {
      const result = formatTimestampForDisplay(TEST_DATES.iso);

      expect(result).toBe("2025-01-03 15:54:56 UTC");
    });

    it("formats timestamp number to UTC timestamp display", ({ expect }) => {
      const result = formatTimestampForDisplay(TEST_DATES.timestamp);

      expect(result).toBe("2025-01-03 15:54:56 UTC");
    });

    it("formats Date object to UTC timestamp display", ({ expect }) => {
      const result = formatTimestampForDisplay(TEST_DATES.dateObj);

      expect(result).toBe("2025-01-03 15:54:56 UTC");
    });

    it("formats different date correctly", ({ expect }) => {
      const differentDate = "2023-06-15T08:30:45.000Z";
      const result = formatTimestampForDisplay(differentDate);

      expect(result).toBe("2023-06-15 08:30:45 UTC");
    });

    it("handles leap year dates", ({ expect }) => {
      const result = formatTimestampForDisplay(DATE_EDGE_CASES.leapYear);

      expect(result).toBe("2024-02-29 12:00:00 UTC");
    });
  });

  describe("formatTimestampLocal", (it) => {
    it("formats ISO string to local timestamp display", ({ expect }) => {
      const result = formatTimestampLocal(TEST_DATES.iso);

      // This will vary based on local timezone, so we just check it returns a string
      expect(typeof result).toBe("string");
      expect(result).toMatch(DATE_FORMAT_REGEX.localTimestamp);
    });

    it("formats timestamp number to local timestamp display", ({ expect }) => {
      const result = formatTimestampLocal(TEST_DATES.timestamp);

      expect(typeof result).toBe("string");
      expect(result).toMatch(DATE_FORMAT_REGEX.localTimestamp);
    });

    it("formats Date object to local timestamp display", ({ expect }) => {
      const result = formatTimestampLocal(TEST_DATES.dateObj);

      expect(typeof result).toBe("string");
      expect(result).toMatch(DATE_FORMAT_REGEX.localTimestamp);
    });
  });

  describe("getCurrentISOTimestamp", (it) => {
    it("returns current timestamp in ISO format", ({ expect }) => {
      const result = getCurrentISOTimestamp();

      expect(result).toBe(MOCK_CURRENT_TIME.toISOString());
      expect(result).toMatch(DATE_FORMAT_REGEX.iso8601);
    });

    it("returns UTC timestamp", ({ expect }) => {
      const result = getCurrentISOTimestamp();
      const parsed = new Date(result);

      expect(parsed.toISOString()).toBe(result);
    });
  });

  describe("getCurrentUTCDate", (it) => {
    it("returns current date as Date object in UTC", ({ expect }) => {
      const result = getCurrentUTCDate();

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(MOCK_CURRENT_TIME.toISOString());
    });

    it("returns date with correct UTC time", ({ expect }) => {
      const result = getCurrentUTCDate();

      expect(result.getUTCHours()).toBe(MOCK_CURRENT_TIME.getUTCHours());
      expect(result.getUTCMinutes()).toBe(MOCK_CURRENT_TIME.getUTCMinutes());
      expect(result.getUTCSeconds()).toBe(MOCK_CURRENT_TIME.getUTCSeconds());
    });
  });

  describe("toISOTimestamp", (it) => {
    it("converts ISO string to ISO timestamp", ({ expect }) => {
      const result = toISOTimestamp(TEST_DATES.iso);

      expect(result).toBe(TEST_DATE_ISO);
    });

    it("converts timestamp number to ISO timestamp", ({ expect }) => {
      const result = toISOTimestamp(TEST_DATES.timestamp);

      expect(result).toBe(TEST_DATE_ISO);
    });

    it("converts Date object to ISO timestamp", ({ expect }) => {
      const result = toISOTimestamp(TEST_DATES.dateObj);

      expect(result).toBe(TEST_DATE_ISO);
    });

    it("defaults to current time when no date provided", ({ expect }) => {
      const result = toISOTimestamp();

      expect(result).toBe(MOCK_CURRENT_TIME.toISOString());
    });

    it("handles different date formats consistently", ({ expect }) => {
      const dateString = "2023-12-25";
      const dateNumber = new Date(dateString).getTime();
      const dateObj = new Date(dateString);

      const result1 = toISOTimestamp(dateString);
      const result2 = toISOTimestamp(dateNumber);
      const result3 = toISOTimestamp(dateObj);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });
});
