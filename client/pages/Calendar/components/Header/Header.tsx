import type { JSX } from "react";
import { useStoreState, useTrackedStore } from "zustand-x";

import { CheckBox } from "@client/components/CheckBox";
import { PageTitle } from "@client/components/PageTitle";
import { CalendarUtilsHelper } from "@client/helpers/calendar-utils.helper";
import { calendarStore } from "@client/pages/Calendar/stores/calendar.store";

import { MonthNavigation } from "./components/MonthNavigation";
import styles from "./Header.module.scss";

const Header = (): JSX.Element => {
  const [showAvailable, setShowAvailable] = useStoreState(
    calendarStore,
    "showOnlyAvailableAppointments"
  );
  const { selectedMonth } = useTrackedStore(calendarStore);

  const { getMonthYearDetails } = CalendarUtilsHelper;

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
      <section
        aria-label="Calendar filters"
        className={styles["filter-controls"]}
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
      </section>
    </div>
  );
};

export { Header };
