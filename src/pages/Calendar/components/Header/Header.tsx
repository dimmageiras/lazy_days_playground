import type { JSX } from "react";
import { useStoreState, useTrackedStore } from "zustand-x";

import { CheckBox } from "~/components/CheckBox";
import { PageTitle } from "~/components/PageTitle";
import { CalendarUtilitiesHelper } from "~/helpers/calendar-utilities.helper";
import { calendarStore } from "~/pages/Calendar/stores/calendar.store";

import { MonthNavigation } from "./components/MonthNavigation";
import styles from "./Header.module.scss";

const Header = (): JSX.Element => {
  const [showAvailable, setShowAvailable] = useStoreState(
    calendarStore,
    "showOnlyAvailableAppointments"
  );
  const { selectedMonth } = useTrackedStore(calendarStore);

  const { getMonthYearDetails } = CalendarUtilitiesHelper;

  const currentMonthYear = getMonthYearDetails(selectedMonth);

  const { monthName, year } = currentMonthYear;
  const pageTitle = `${monthName} ${year}`;

  return (
    <div className={styles["header"]}>
      <section
        aria-label="Calendar navigation"
        className={styles["month-navigation"]}
      >
        <MonthNavigation>
          <PageTitle
            aria-label="Current month and year"
            className={styles["page-title"]}
            pageTitle={pageTitle}
          />
        </MonthNavigation>
      </section>
      <div
        aria-label="Calendar filters"
        className={styles["filter-controls"]}
        role="group"
      >
        <CheckBox
          aria-label="Only show available"
          id="only-show-available"
          isChecked={showAvailable}
          label="Only show available"
          name="only-show-available"
          onChange={() => setShowAvailable(!showAvailable)}
          value="only-show-available"
        />
      </div>
    </div>
  );
};

export { Header };
