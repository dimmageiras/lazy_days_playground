import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

import type { MonthYear } from "@client/types/calendar.type";

/**
 * Extracts detailed month and year information from a given date.
 *
 * @param initialDate - The date to extract month/year details from
 * @returns An object containing comprehensive month details including:
 *   - firstDOW: Day of week for the first day of the month
 *   - lastDate: The last date number of the month
 *   - monthName: Full month name
 *   - startDate: Dayjs object for the first day of the month
 *   - year: Four-digit year string
 *
 * @example
 * ```typescript
 * const details = getMonthYearDetails(dayjs('2024-03-15'));
 * // Returns: {
 * //   firstDOW: 5,        // March 1st, 2024 is a Friday
 * //   lastDate: 31,       // March has 31 days
 * //   monthName: "March",
 * //   startDate: Dayjs('2024-03-01'),
 * //   year: "2024"
 * // }
 * ```
 */
const getMonthYearDetails = (initialDate: Dayjs): MonthYear => {
  const month = initialDate.format("MM");
  const year = initialDate.format("YYYY");

  const startDate = dayjs(`${year}${month}01`);

  const firstDOW = Number(startDate.format("d"));
  const lastDate = Number(startDate.clone().endOf("month").format("DD"));
  const monthName = startDate.format("MMMM");

  return {
    firstDOW,
    lastDate,
    monthName,
    startDate,
    year,
  };
};

/**
 * Creates a new date by adding or subtracting months from a given MonthYear.
 *
 * @param monthYear - The base month/year data to modify
 * @param monthIncrement - Number of months to add (positive) or subtract (negative)
 * @returns A new Dayjs object representing the updated date
 *
 * @example
 * ```typescript
 * const currentMonth = getMonthYearDetails(dayjs('2024-03-01'));
 * const nextMonth = getUpdatedMonthYear(currentMonth, 1);     // April 2024
 * const prevMonth = getUpdatedMonthYear(currentMonth, -1);    // February 2024
 * ```
 */
const getUpdatedMonthYear = (
  monthYear: MonthYear,
  monthIncrement: number
): Dayjs => {
  return monthYear.startDate.clone().add(monthIncrement, "months");
};

export const CalendarUtilsHelper = {
  getMonthYearDetails,
  getUpdatedMonthYear,
};
