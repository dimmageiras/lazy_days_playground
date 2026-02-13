import dayjs from "dayjs";
import { describe } from "vitest";

import { CalendarUtilsHelper } from "./calendar-utils.helper";

const { getMonthYearDetails, getUpdatedMonthYear } = CalendarUtilsHelper;

// Test data constants
const TEST_DATA = {
  TEST_DATE: dayjs("2024-03-01"),
  MONTH_YEAR_DETAILS: {
    firstDOW: 5,
    lastDate: 31,
    monthName: "March",
    year: "2024",
  },
  UPDATED_MONTH_OFFSET: 1,
  UPDATED_MONTH_EXPECTED: "2024-04-01",
} as const;

// Factory function to create a test month year details object
const createTestMonthYearDetails = () => ({
  ...TEST_DATA.MONTH_YEAR_DETAILS,
  startDate: TEST_DATA.TEST_DATE,
});

describe("CalendarUtilsHelper", () => {
  describe("getMonthYearDetails", (it) => {
    it("should get the month year details", ({ expect }) => {
      const result = getMonthYearDetails(TEST_DATA.TEST_DATE);

      expect(result).toBeDefined();
      expect(result.firstDOW).toBe(TEST_DATA.MONTH_YEAR_DETAILS.firstDOW);
      expect(result.lastDate).toBe(TEST_DATA.MONTH_YEAR_DETAILS.lastDate);
      expect(result.monthName).toBe(TEST_DATA.MONTH_YEAR_DETAILS.monthName);
      expect(result.startDate.format("YYYY-MM-DD")).toBe(
        TEST_DATA.TEST_DATE.format("YYYY-MM-DD"),
      );
      expect(result.year).toBe(TEST_DATA.MONTH_YEAR_DETAILS.year);
    });
  });

  describe("getUpdatedMonthYear", (it) => {
    it("should get the updated month year", ({ expect }) => {
      const result = getUpdatedMonthYear(
        createTestMonthYearDetails(),
        TEST_DATA.UPDATED_MONTH_OFFSET,
      );

      expect(result).toBeDefined();
      expect(result.format("YYYY-MM-DD")).toBe(
        TEST_DATA.UPDATED_MONTH_EXPECTED,
      );
    });
  });
});
