import type { JSX } from "react";

import { TreatmentOptions } from "./components/TreatmentOptions";
import styles from "./TreatmentFilter.module.scss";

const TreatmentFilter = (): JSX.Element => {
  return (
    <div className={styles["treatment-filter"]} role="radiogroup">
      <div className={styles["filters"]}>
        <h2>Filter by treatment:</h2>
        <TreatmentOptions />
      </div>
    </div>
  );
};

export { TreatmentFilter };
