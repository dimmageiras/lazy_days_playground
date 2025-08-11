import type { JSX } from "react";

import { Filters } from "./components/Filters";
import styles from "./TreatmentFilter.module.scss";

const TreatmentFilter = (): JSX.Element => {
  return (
    <div
      aria-label="Treatment filter"
      className={styles["treatment-filter"]}
      role="radiogroup"
    >
      <div aria-label="Treatment filter options" className={styles["filters"]}>
        <h2 aria-label="Filter by treatment">Filter by treatment:</h2>
        <Filters />
      </div>
    </div>
  );
};

export { TreatmentFilter };
