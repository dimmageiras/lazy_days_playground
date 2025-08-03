import type { JSX } from "react";
import { useTrackedStore } from "zustand-x";

import { ListRenderer } from "~/components/ListRenderer";
import { CalendarUtilitiesHelper } from "~/helpers/calendar-utilities.helper";
import type { Appointment as AppointmentType } from "~/pages/Calendar/constants";
import { calendarStore } from "~/pages/Calendar/stores/calendar.store";

import { Appointment } from "./components/Appointment";
import styles from "./DateBox.module.scss";

interface DateBoxProps {
  dailyAppointments: AppointmentType[];
  day: number;
}

const DateBox = ({ dailyAppointments, day }: DateBoxProps): JSX.Element => {
  const { selectedMonth } = useTrackedStore(calendarStore);

  const { getMonthYearDetails } = CalendarUtilitiesHelper;

  const { firstDOW } = getMonthYearDetails(selectedMonth);

  return (
    <div
      className={styles["date-box"]}
      {...(day === 1 && { style: { gridColumnStart: String(firstDOW + 1) } })}
    >
      <div className={styles["details"]}>
        <p className={styles["day"]}>{day}</p>
        <ListRenderer
          data={dailyAppointments}
          getKey={(appointment): number => appointment.id}
          renderComponent={({ data: appointment }): JSX.Element => {
            return <Appointment {...appointment} />;
          }}
        />
      </div>
    </div>
  );
};

export { DateBox };
