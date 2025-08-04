import type { JSX } from "react";
import { useTrackedStore } from "zustand-x";

import { ListRenderer } from "@Client/components/ListRenderer";
import { CalendarUtilitiesHelper } from "@Client/helpers/calendar-utilities.helper";
import type { Appointment } from "@Client/pages/Calendar/constants";
import { APPOINTMENTS } from "@Client/pages/Calendar/constants";
import { calendarStore } from "@Client/pages/Calendar/stores/calendar.store";

import { DateBox } from "./components/DateBox";
import styles from "./MonthDisplay.module.scss";

const MonthDisplay = (): JSX.Element => {
  const { selectedMonth, showOnlyAvailableAppointments } =
    useTrackedStore(calendarStore);

  const { getMonthYearDetails } = CalendarUtilitiesHelper;
  const { lastDate } = getMonthYearDetails(selectedMonth);

  const daysInMonth = [...Array(lastDate)].map((_, index) => index + 1);

  return (
    <div className={styles["month-display"]}>
      <ListRenderer
        data={daysInMonth}
        getKey={(dayOfMonth): string => {
          return `day-${dayOfMonth}`;
        }}
        renderComponent={({ data: dayOfMonth }): JSX.Element => {
          const allDailyAppointments: Appointment[] =
            Reflect.get(APPOINTMENTS, dayOfMonth) || [];

          const dailyAppointments = showOnlyAvailableAppointments
            ? allDailyAppointments.filter((appointment) => !appointment.userId)
            : allDailyAppointments;

          return (
            <DateBox day={dayOfMonth} dailyAppointments={dailyAppointments} />
          );
        }}
      />
    </div>
  );
};

export { MonthDisplay };
