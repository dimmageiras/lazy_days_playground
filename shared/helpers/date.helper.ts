import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

// Enable UTC plugin
dayjs.extend(utc);

/**
 * Formats a date/timestamp to show hour in UTC for SSR hydration safety.
 * This ensures server and client render identical hour strings.
 *
 * @param date - Date string, number, or Date object
 * @returns Formatted UTC hour string (e.g., "10 am")
 */
const formatHourForDisplay = (date: string | number | Date): string => {
  return dayjs(date).utc().format("h a");
};

/**
 * Formats a date/timestamp to a consistent UTC format for SSR hydration safety.
 * This ensures server and client render identical timestamp strings.
 *
 * @param date - Date string, number, or Date object
 * @returns Formatted UTC timestamp string
 *
 * @example
 * ```typescript
 * formatTimestampForDisplay("2025-01-03T15:54:56.000Z")
 * // Returns: "2025-01-03 15:54:56 UTC"
 * ```
 */
const formatTimestampForDisplay = (date: string | number | Date): string => {
  return dayjs(date).utc().format("YYYY-MM-DD HH:mm:ss") + " UTC";
};

/**
 * Formats a date/timestamp to user's local timezone.
 * Use this only when hydration safety is not a concern.
 *
 * @param date - Date string, number, or Date object
 * @returns Formatted local timestamp string
 */
const formatTimestampLocal = (date: string | number | Date): string => {
  return dayjs(date).format("MM/DD/YYYY, hh:mm:ss A");
};

/**
 * Generates a current UTC timestamp in ISO 8601 format.
 * Use this for consistent API response timestamps.
 *
 * @returns ISO 8601 formatted timestamp string
 *
 * @example
 * ```typescript
 * getCurrentISOTimestamp()
 * // Returns: "2025-01-03T15:54:56.000Z"
 * ```
 */
const getCurrentISOTimestamp = (): string => {
  return dayjs().utc().toISOString();
};

/**
 * Gets the current date/time as a Date object in UTC.
 * Use this for accurate time comparisons regardless of server timezone.
 *
 * @returns Current date/time as Date object (UTC)
 *
 * @example
 * ```typescript
 * const now = getCurrentUTCDate();
 * if (expiresAt < now) {
 *   // Token is expired
 * }
 * ```
 */
const getCurrentUTCDate = (): Date => {
  return dayjs().utc().toDate();
};

/**
 * Converts any date to UTC ISO 8601 format.
 * Use this when you need to format a specific date/time.
 *
 * @param date - Date string, number, or Date object (optional, defaults to now)
 * @returns ISO 8601 formatted timestamp string
 */
const toISOTimestamp = (date?: string | number | Date): string => {
  return dayjs(date).utc().toISOString();
};

export const DateHelper = {
  formatHourForDisplay,
  formatTimestampForDisplay,
  formatTimestampLocal,
  getCurrentISOTimestamp,
  getCurrentUTCDate,
  toISOTimestamp,
};
