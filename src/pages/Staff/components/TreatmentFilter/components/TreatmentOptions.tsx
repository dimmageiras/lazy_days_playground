import type { JSX } from "react";
import { useState } from "react";
import type { CamelCase } from "type-fest";

import { ListRenderer } from "~/components/ListRenderer";
import { RadioButton } from "~/components/RadioButton";
import { StringManipulationHelper } from "~/helpers/string-manipulation.helper";

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

  const { safeCamelCase } = StringManipulationHelper;

  const treatmentOptions = [{ id: 0, name: "All" }, ...TREATMENTS] as const;

  const handleTreatmentChange = (treatment: TreatmentNames) => {
    setSelectedTreatment(treatment);
  };

  return (
    <ListRenderer
      data={treatmentOptions}
      getKey={(treatment) => treatment.id}
      renderComponent={({ data: treatmentOption }): JSX.Element => {
        const treatmentValue = safeCamelCase(treatmentOption.name);

        return (
          <RadioButton
            id={`radio-${treatmentValue}`}
            isChecked={selectedTreatment === treatmentValue}
            label={treatmentOption.name}
            name="treatment"
            onChange={() => handleTreatmentChange(treatmentValue)}
            value={treatmentValue}
          />
        );
      }}
    />
  );
};

export { TreatmentOptions };
