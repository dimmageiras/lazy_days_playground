import camelcase from "lodash/camelCase";
import type { JSX } from "react";
import { useState } from "react";
import type { CamelCase } from "type-fest";

import { RadioButton } from "~/components/RadioButton";

import styles from "./TreatmentFilter.module.scss";

const TREATMENTS = [
  {
    id: 1,
    name: "Massage",
  },
  {
    id: 2,
    name: "Facial",
  },
  {
    id: 3,
    name: "Scrub",
  },
] as const;

type CamelCaseTreatmentNames = CamelCase<(typeof TREATMENTS)[number]["name"]>;

type TreatmentNames = (CamelCaseTreatmentNames | "all") & string;

const TreatmentFilter = (): JSX.Element => {
  const [selectedTreatment, setSelectedTreatment] =
    useState<TreatmentNames>("all");

  const camelcaseTreatmentNames = TREATMENTS.map(
    (treatment) => camelcase(treatment.name) as CamelCaseTreatmentNames
  );

  const handleTreatmentChange = (treatment: TreatmentNames) => {
    setSelectedTreatment(treatment);
  };

  return (
    <div className={styles["treatment-filter"]} role="radiogroup">
      <div className={styles["filters"]}>
        <h2>Filter by treatment:</h2>
        <RadioButton
          id="radia-all"
          isChecked={selectedTreatment === "all"}
          label="All"
          name="treatment"
          onChange={() => handleTreatmentChange("all")}
          value="all"
        />
        {TREATMENTS.map((treatment, index) => {
          const treatmentValue = Reflect.get(camelcaseTreatmentNames, index);

          return (
            <RadioButton
              id={`radio-${treatmentValue}`}
              isChecked={selectedTreatment === treatmentValue}
              key={treatment.id}
              label={treatment.name}
              name="treatment"
              onChange={() => handleTreatmentChange(treatmentValue)}
              value={treatmentValue}
            />
          );
        })}
      </div>
    </div>
  );
};

export { TreatmentFilter };
