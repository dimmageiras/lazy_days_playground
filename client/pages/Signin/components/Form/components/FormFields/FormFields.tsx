import type { JSX } from "react";
import { memo, useMemo } from "react";

import { ListRenderer } from "@client/components/ListRenderer";
import { ObjectUtilsHelper } from "@client/helpers/object-utils.helper";

import { Field } from "./components/Field";
import { FORM_FIELDS } from "./constants/form-fields.constant";

interface FormFieldsProps {
  isSubmitting: boolean;
}

const FormFields = memo(({ isSubmitting }: FormFieldsProps): JSX.Element => {
  const { getObjectEntries } = ObjectUtilsHelper;
  const formFields = useMemo(() => getObjectEntries(FORM_FIELDS), []);

  return (
    <fieldset disabled={isSubmitting}>
      <ListRenderer
        data={formFields}
        getKey={([key]) => key}
        renderComponent={({ data: [key, value] }) => (
          <Field key={key} name={value} />
        )}
      />
      <button type="submit">SUBMIT</button>
    </fieldset>
  );
});

FormFields.displayName = "FormFields";

export { FormFields };
