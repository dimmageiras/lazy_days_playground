import type { JSX } from "react";

import { TextInput } from "@client/components/TextInput";

import { ActionButtons } from "./components/ActionButtons";
import { ConfirmPassword } from "./components/ConfirmPassword";
import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";
import { FORM_FIELDS } from "./constants/form-fields.constant";
import styles from "./FormFields.module.scss";

const {
  EMAIL: { label: emailLabel },
  PASSWORD: { label: passwordLabel },
} = FORM_FIELDS;

interface FormFieldsProps {
  isExistingUser: boolean;
  isFormLoading: boolean;
  isFormValid: boolean;
  isNewUser: boolean;
  isUnchecked: boolean;
}

const FormFields = ({
  isExistingUser,
  isFormLoading,
  isFormValid,
  isNewUser,
  isUnchecked,
}: FormFieldsProps): JSX.Element => {
  const shouldEnableSignIn = isFormValid && isExistingUser;
  const shouldEnableSignUp = isFormValid && isNewUser;

  return (
    <fieldset className={styles["fieldset"]}>
      {isFormLoading ? (
        <>
          <TextInput
            hasFloatingLabel
            isLoading
            label={emailLabel}
            type="email"
          />
          <TextInput
            hasFloatingLabel
            isLoading
            label={passwordLabel}
            type="password"
          />
        </>
      ) : (
        <>
          <EmailField />
          <PasswordField />
        </>
      )}
      {isNewUser ? <ConfirmPassword /> : null}
      <ActionButtons
        shouldDisableActionButtons={isUnchecked}
        shouldEnableSignIn={shouldEnableSignIn}
        shouldEnableSignUp={shouldEnableSignUp}
      />
    </fieldset>
  );
};

export { FormFields };
