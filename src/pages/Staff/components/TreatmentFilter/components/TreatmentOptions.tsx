import lodash from "lodash";
import type { JSX } from "react";
import { useState } from "react";
import type { CamelCase } from "type-fest";

import { ListRenderer } from "~/components/ListRenderer";
import { RadioButton } from "~/components/RadioButton";

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

const TreatmentOptions = (): JSX.Element => {
  const [selectedTreatment, setSelectedTreatment] =
    useState<TreatmentNames>("all");

  const { camelCase } = lodash;

  const camelcaseTreatmentNames = TREATMENTS.map(
    (treatment) => camelCase(treatment.name) as CamelCaseTreatmentNames
  );

  const handleTreatmentChange = (treatment: TreatmentNames) => {
    setSelectedTreatment(treatment);
  };

  return (
    <>
      <RadioButton
        id="radio-all"
        isChecked={selectedTreatment === "all"}
        label="All"
        name="treatment"
        onChange={() => handleTreatmentChange("all")}
        value="all"
      />
      <ListRenderer
        data={TREATMENTS}
        getKey={(treatment) => treatment.id}
        renderComponent={({ data, index }): JSX.Element => {
          const treatmentValue = Reflect.get(camelcaseTreatmentNames, index);

          return (
            <RadioButton
              id={`radio-${treatmentValue}`}
              isChecked={selectedTreatment === treatmentValue}
              key={data.id}
              label={data.name}
              name="treatment"
              onChange={() => handleTreatmentChange(treatmentValue)}
              value={treatmentValue}
            />
          );
        }}
      />
    </>
  );
};

export { TreatmentOptions };
