import type { JSX } from "react";

import { IS_EXISTING_USER } from "@client/constants/user.constants";

import { ActionButtons } from "./components/ActionButtons";
import { ConfirmPassword } from "./components/ConfirmPassword";
import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";
import styles from "./FormFields.module.scss";

interface FormFieldsProps {
  isExistingUser: (typeof IS_EXISTING_USER)[keyof typeof IS_EXISTING_USER];
  isFormValid: boolean;
}

const FormFields = ({
  isExistingUser,
  isFormValid,
}: FormFieldsProps): JSX.Element => {
  const shouldEnableSignIn =
    isFormValid && isExistingUser === IS_EXISTING_USER.TRUE;
  const shouldEnableSignUp =
    isFormValid && isExistingUser === IS_EXISTING_USER.FALSE;

  return (
    <fieldset className={styles["fieldset"]}>
      <EmailField />
      <PasswordField />
      {isExistingUser === IS_EXISTING_USER.FALSE ? <ConfirmPassword /> : null}
      <ActionButtons
        shouldDisableActionButtons={isExistingUser === IS_EXISTING_USER.NULL}
        shouldEnableSignIn={shouldEnableSignIn}
        shouldEnableSignUp={shouldEnableSignUp}
      />
    </fieldset>
  );
};

export { FormFields };
