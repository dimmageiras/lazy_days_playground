import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

// Enable UTC plugin
dayjs.extend(utc);

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
 * Formats a date/timestamp to show hour in UTC for SSR hydration safety.
 * This ensures server and client render identical hour strings.
 *
 * @param date - Date string, number, or Date object
 * @returns Formatted UTC hour string (e.g., "10 am")
 */
const formatHourForDisplay = (date: string | number | Date): string => {
  return dayjs(date).utc().format("h a");
};

export const DateHelper = {
  formatTimestampForDisplay,
  formatTimestampLocal,
  formatHourForDisplay,
};
