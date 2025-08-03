import type { Dayjs } from "dayjs";

/**
 * Represents the structure for month and year data used in calendar components.
 * Contains all necessary information to render a calendar month view including
 * day-of-week positioning, date ranges, and formatted date strings.
 */
interface MonthYear {
  /** First day of week for the month (0-6, where 0=Sunday, 1=Monday, etc.) */
  firstDOW: number;
  /** Last date number of the month (28-31) */
  lastDate: number;
  /** Full month name (e.g., "January", "February") */
  monthName: string;
  /** Dayjs object representing the first day of the month */
  startDate: Dayjs;
  /** Year as a string (e.g., "2024") */
  year: string;
}

export type { MonthYear };
