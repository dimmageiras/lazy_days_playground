import type { JSX } from "react";
import { useState } from "react";

import { CheckBox } from "~/components/CheckBox";
import { PageTitle } from "~/components/PageTitle";

import { MonthNavigation } from "./components/MonthNavigation";
import styles from "./Header.module.scss";

const Header = (): JSX.Element => {
  const [isOnlyShowAvailable, setIsOnlyShowAvailable] = useState(false);

  return (
    <header className={styles["header"]}>
      <section
        aria-label="Calendar navigation"
        className={styles["month-navigation"]}
      >
        <MonthNavigation>
          <PageTitle
            aria-label="Current month and year"
            className={styles["page-title"]}
            pageTitle="Calendar"
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
          isChecked={isOnlyShowAvailable}
          label="Only show available"
          name="only-show-available"
          onChange={() => setIsOnlyShowAvailable(!isOnlyShowAvailable)}
          value="only-show-available"
        />
      </div>
    </header>
  );
};

export { Header };
