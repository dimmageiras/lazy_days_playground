/**
 * Shared test data and utilities for unit tests
 * This file contains common test fixtures and helper functions used across multiple test files
 */

import type { Mock, MockInstance } from "vitest";
import { vi } from "vitest";

import type { DateType } from "@shared/types/date.type";

// =============================================================================
// PRIMITIVE VALUES & BUILT-IN OBJECTS
// =============================================================================

/**
 * Common primitive values used for testing type guards and validation functions
 */
export const PRIMITIVE_VALUES = [
  "string",
  42,
  true,
  Symbol("test"),
  BigInt(123),
] as const;

/**
 * Primitive values excluding BigInt (for tests that don't support BigInt)
 */
export const COMMON_PRIMITIVE_VALUES = [
  "string",
  42,
  true,
  Symbol("test"),
] as const;

/**
 * Common built-in objects used for testing type guards
 */
export const BUILTIN_OBJECTS = [
  new Date(),
  /test/,
  new Map(),
  new Set(),
  Promise.resolve(),
] as const;

// =============================================================================
// TYPE GUARD TEST HELPERS
// =============================================================================

/**
 * Creates a test class instance for testing class instances in type guards
 */
export const createTestClassInstance = (): unknown =>
  new (class {
    name = "test";
  })();

/**
 * Dummy function for testing function type guards
 */
export function testFunction(): void {
  return;
}

/**
 * Array-like object without Array prototype for testing
 */
export const createArrayLikeObject = (): Record<string, unknown> => ({
  length: 3,
  0: "a",
  1: "b",
  2: "c",
});

/**
 * Creates an object with symbol keys for testing key filtering
 */
export const createObjectWithSymbolKeys = (): Record<string, unknown> => {
  const symbolKey = Symbol("test");

  return {
    normal: "value",
    [symbolKey]: "symbolValue",
  };
};

/**
 * Creates an object with numeric string keys for testing
 */
export const createObjectWithNumericKeys = (): Record<string, unknown> => ({
  1: "one",
  2: "two",
  "3": "three",
});

/**
 * Creates an object with undefined and null values for testing
 */
export const createObjectWithNullishValues = (): Record<string, unknown> => ({
  defined: "value",
  undefined: undefined,
  null: null,
});

// =============================================================================
// DATE TEST DATA
// =============================================================================

/**
 * Common date test data for consistent date-related testing
 */
export const TEST_DATE_ISO = "2025-01-03T15:54:56.000Z"; // 3:54:56 PM UTC on Jan 3, 2025
export const TEST_DATE_TIMESTAMP = 1735919696000; // Same as TEST_DATE_ISO
export const TEST_DATE_OBJ = new Date(TEST_DATE_ISO);

export const TEST_DATES = {
  iso: TEST_DATE_ISO,
  timestamp: TEST_DATE_TIMESTAMP,
  dateObj: TEST_DATE_OBJ,
} as const;

/**
 * Common date edge cases for testing
 */
export const DATE_EDGE_CASES = {
  midnight: "2025-01-03T00:00:00.000Z",
  noon: "2025-01-03T12:00:00.000Z",
  endOfDay: "2025-01-03T23:59:59.000Z",
  leapYear: "2024-02-29T12:00:00.000Z",
  newYear: "2025-01-01T00:00:00.000Z",
  summerTime: "2025-06-15T14:30:45.000Z",
  winterTime: "2025-12-15T09:15:30.000Z",
} as const;

/**
 * Common date format regex patterns for validation
 */
export const DATE_FORMAT_REGEX = {
  iso8601: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
  utcTimestamp: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/,
  localTimestamp: /^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2} (AM|PM)$/,
  hourDisplay: /^\d{1,2} (am|pm)$/,
} as const;

/**
 * Mock current time for consistent testing across date-related tests
 */
export const MOCK_CURRENT_TIME = new Date("2025-12-09T12:00:00.000Z");

// =============================================================================
// MOCK UTILITIES
// =============================================================================

/**
 * Creates a dayjs mock factory for consistent date testing
 * Usage: vi.mock("dayjs", () => createDayjsMock())
 */
export const createDayjsMock = (): {
  default: MockInstance & {
    (...args: unknown[]): unknown;
    new (...args: unknown[]): unknown;
  } & {
    extend: Mock;
  };
} => ({
  default: Object.assign(
    vi.fn().mockImplementation((date?: DateType) => {
      if (date === undefined) {
        // Mock current time
        return {
          utc: () => ({
            format: (format: string) => {
              if (format === "h a") {
                return "12 pm";
              }

              if (format === "YYYY-MM-DD HH:mm:ss") {
                return "2025-12-09 12:00:00";
              }

              return "";
            },
            toISOString: () => MOCK_CURRENT_TIME.toISOString(),
            toDate: () => new Date(MOCK_CURRENT_TIME),
          }),
          format: (format: string) => {
            if (format === "MM/DD/YYYY, hh:mm:ss A") {
              return "12/09/2025, 12:00:00 PM";
            }

            return "";
          },
        };
      }

      // Mock specific dates
      const testDate = new Date(date);

      return {
        utc: () => ({
          format: (format: string) => {
            if (format === "h a") {
              const hour = testDate.getUTCHours();
              const ampm = hour >= 12 ? "pm" : "am";
              let displayHour = hour;

              if (hour === 0) {
                displayHour = 12;
              } else if (hour > 12) {
                displayHour = hour - 12;
              }

              return `${displayHour} ${ampm}`;
            }

            if (format === "YYYY-MM-DD HH:mm:ss") {
              return testDate.toISOString().slice(0, 19).replace("T", " ");
            }

            return "";
          },
          toISOString: () => testDate.toISOString(),
          toDate: () => new Date(testDate),
        }),
        format: (format: string) => {
          if (format === "MM/DD/YYYY, hh:mm:ss A") {
            return testDate.toLocaleString("en-US", {
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            });
          }

          return "";
        },
      };
    }),
    { extend: vi.fn() }
  ),
});
