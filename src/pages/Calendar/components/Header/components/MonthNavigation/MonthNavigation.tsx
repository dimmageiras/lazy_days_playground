import classNames from "classnames";
import dayjs from "dayjs";
import { type JSX, type PropsWithChildren } from "react";
import { useStoreState } from "zustand-x";

import { IconifyIcon } from "~/components/IconifyIcon";
import { CalendarUtilitiesHelper } from "~/helpers/calendar-utilities.helper";
import { calendarStore } from "~/pages/Calendar/stores/calendar.store";

import styles from "./MonthNavigation.module.scss";

const CURRENT_DATE = dayjs();

const MonthNavigation = ({ children }: PropsWithChildren): JSX.Element => {
  const [selectedMonth, setSelectedMonth] = useStoreState(
    calendarStore,
    "selectedMonth"
  );

  const { getMonthYearDetails, getUpdatedMonthYear } = CalendarUtilitiesHelper;

  const currentMonthYear = getMonthYearDetails(selectedMonth);

  const { startDate } = currentMonthYear;

  const updateMonthYear = (monthIncrement: number): void => {
    setSelectedMonth(getUpdatedMonthYear(currentMonthYear, monthIncrement));
  };

  return (
    <>
      <button
        aria-label="Go to previous month"
        className={classNames(
          styles["month-navigation-button"],
          styles["previous"]
        )}
        disabled={startDate < CURRENT_DATE}
        onClick={() => updateMonthYear(-1)}
        type="button"
      >
        <IconifyIcon icon="typcn:arrow-left-thick" />
      </button>
      {children}
      <button
        aria-label="Go to next month"
        className={styles["month-navigation-button"]}
        onClick={() => updateMonthYear(1)}
        type="button"
      >
        <IconifyIcon icon="typcn:arrow-right-thick" />
      </button>
    </>
  );
};

export { MonthNavigation };
