import type { JSX } from "react";

import { ActionButtons } from "./components/ActionButtons";
import { ConfirmPassword } from "./components/ConfirmPassword";
import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";
import styles from "./FormFields.module.scss";

interface FormFieldsProps {
  isExistingUser: boolean;
  isFormValid: boolean;
  isNewUser: boolean;
  isUnchecked: boolean;
}

const FormFields = ({
  isExistingUser,
  isFormValid,
  isNewUser,
  isUnchecked,
}: FormFieldsProps): JSX.Element => {
  const shouldEnableSignIn = isFormValid && isExistingUser;
  const shouldEnableSignUp = isFormValid && isNewUser;

  return (
    <fieldset className={styles["fieldset"]}>
      <EmailField />
      <PasswordField />
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
