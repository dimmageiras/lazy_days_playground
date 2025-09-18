import type { JSX } from "react";
import { memo } from "react";

import { TextInput } from "@client/components/TextInput";

import { ActionButtons } from "./components/ActionButtons";
import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";
import styles from "./FormFields.module.scss";

interface FormFieldsProps {
  isFormLoading: boolean;
  isFormValid: boolean;
}

const FormFields = memo(
  ({ isFormLoading, isFormValid }: FormFieldsProps): JSX.Element => {
    return (
      <fieldset className={styles["fieldset"]}>
        {isFormLoading ? (
          <TextInput
            hasFloatingLabel
            isLoading={isFormLoading}
            label="Email"
            type="email"
          />
        ) : (
          <EmailField />
        )}
        {isFormLoading ? (
          <TextInput
            hasFloatingLabel
            isLoading={isFormLoading}
            label="Password"
            type="password"
          />
        ) : (
          <PasswordField />
        )}
        <ActionButtons isFormValid={isFormValid} />
      </fieldset>
    );
  }
);

FormFields.displayName = "FormFields";

export { FormFields };
