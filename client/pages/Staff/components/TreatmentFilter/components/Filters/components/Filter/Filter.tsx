import type { JSX } from "react";
import { useCallback } from "react";
import { useStoreState } from "zustand-x";

import { RadioButton } from "@client/components/RadioButton";
import { StringUtilsHelper } from "@client/helpers/string-utils.helper";
import { staffStore } from "@client/pages/Staff/stores/staff.store";
import type { TreatmentNames } from "@client/types/staff.types";

interface FilterProps {
  filter: {
    id: number;
    name: Capitalize<TreatmentNames>;
  };
}

const Filter = ({ filter }: FilterProps): JSX.Element => {
  const [selectedTreatment, setSelectedTreatment] = useStoreState(
    staffStore,
    "selectedTreatment"
  );

  const { safeCamelCase } = StringUtilsHelper;

  const treatmentValue = safeCamelCase(filter.name);

  const handleTreatmentChange = useCallback(
    () => setSelectedTreatment(treatmentValue),
    [treatmentValue]
  );

  return (
    <RadioButton
      id={`radio-${treatmentValue}`}
      isChecked={selectedTreatment === treatmentValue}
      label={filter.name}
      name="treatment"
      onChange={handleTreatmentChange}
      value={treatmentValue}
    />
  );
};

export { Filter };
