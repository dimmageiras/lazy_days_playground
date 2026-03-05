import type { JSX } from "react";
import { useStoreState } from "zustand-x";

import { RadioButton } from "@client/components/RadioButton";
import { staffStore } from "@client/pages/Staff/stores/staff.store";
import type { TreatmentNames } from "@client/types/staff.type";
import { StringUtilsHelper } from "@shared/helpers/string-utils.helper";

interface FilterProps {
  filter: {
    id: number;
    name: Capitalize<TreatmentNames>;
  };
}

const Filter = ({ filter }: FilterProps): JSX.Element => {
  const [selectedTreatment, setSelectedTreatment] = useStoreState(
    staffStore,
    "selectedTreatment",
  );

  const { safeCamelCase } = StringUtilsHelper;

  const treatmentValue = safeCamelCase(filter.name);

  return (
    <RadioButton
      id={`radio-${treatmentValue}`}
      isChecked={selectedTreatment === treatmentValue}
      label={filter.name}
      name="treatment"
      onChange={() => setSelectedTreatment(treatmentValue)}
      value={treatmentValue}
    />
  );
};

export { Filter };
