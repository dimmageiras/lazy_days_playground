import type { JSX } from "react";
import { memo, useMemo } from "react";

import { ListRenderer } from "@client/components/ListRenderer";
import { ObjectUtilsHelper } from "@client/helpers/object-utils.helper";

import { Field } from "./components/Field";
import { FORM_FIELDS } from "./constants/form-fields.constant";
import styles from "./FormFields.module.scss";

interface FormFieldsProps {
  isSubmitting: boolean;
}

const FormFields = memo(({ isSubmitting }: FormFieldsProps): JSX.Element => {
  const { getObjectEntries } = ObjectUtilsHelper;
  const formFields = useMemo(() => getObjectEntries(FORM_FIELDS), []);

  return (
    <fieldset className={styles["form-fields"]} disabled={isSubmitting}>
      <ListRenderer
        data={formFields}
        getKey={([key]) => key}
        renderComponent={({ data: [key, value] }) => (
          <Field
            key={key}
            label={value.label}
            name={value.name}
            shouldAutoFocus={value.name === FORM_FIELDS.EMAIL.name}
          />
        )}
      />
      <button type="submit">SUBMIT</button>
    </fieldset>
  );
});

FormFields.displayName = "FormFields";

export { FormFields };
