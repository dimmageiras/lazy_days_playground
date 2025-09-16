import type { JSX } from "react";
import { memo } from "react";

import { ActionButtons } from "./components/ActionButtons";
import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";
import styles from "./FormFields.module.scss";

interface FormFieldsProps {
  isFieldsetDisabled: boolean;
  isFormValid: boolean;
}

const FormFields = memo(
  ({ isFieldsetDisabled, isFormValid }: FormFieldsProps): JSX.Element => {
    return (
      <fieldset className={styles["fieldset"]} disabled={isFieldsetDisabled}>
        <EmailField />
        <PasswordField />
        <ActionButtons isFormValid={isFormValid} />
      </fieldset>
    );
  }
);

FormFields.displayName = "FormFields";

export { FormFields };
