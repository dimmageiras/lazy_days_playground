import { type JSX, useState } from "react";

import { CheckBox } from "~/components/CheckBox";
import { PageTitle } from "~/components/PageTitle";

import { MonthNavigation } from "./components/MonthNavigation";
import styles from "./Header.module.scss";

const Header = (): JSX.Element => {
  const [isOnlyShowAvailable, setIsOnlyShowAvailable] = useState(false);

  return (
    <div className={styles["header"]}>
      <div className={styles["month-navigation"]}>
        <MonthNavigation>
          <PageTitle className={styles["page-title"]} pageTitle="Calendar" />
        </MonthNavigation>
      </div>
      <CheckBox
        className={styles["checkbox"]}
        id="only-show-available"
        isChecked={isOnlyShowAvailable}
        label="Only show available"
        name="only-show-available"
        onChange={() => setIsOnlyShowAvailable(!isOnlyShowAvailable)}
        value="only-show-available"
      />
    </div>
  );
};

export { Header };
