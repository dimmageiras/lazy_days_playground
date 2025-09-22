import type { JSX } from "react";
import { memo, useMemo } from "react";

import { useEmailExistence } from "@client/api/user/useEmailExistence.query";
import { TextInput } from "@client/components/TextInput";

import { ActionButtons } from "./components/ActionButtons";
import { ConfirmPassword } from "./components/ConfirmPassword";
import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";
import styles from "./FormFields.module.scss";

interface FormFieldsProps {
  isFormLoading: boolean;
  isFormValid: boolean;
}

const FormFields = memo(
  ({ isFormLoading, isFormValid }: FormFieldsProps): JSX.Element => {
    const { isExistingUser, isNewUser, isUnchecked } = useEmailExistence();

    const shouldEnableSignIn = isFormValid && isExistingUser;
    const shouldEnableSignUp = isFormValid && isNewUser;

    const emailField = useMemo(() => {
      return isFormLoading ? (
        <TextInput hasFloatingLabel isLoading label="Email" type="email" />
      ) : (
        <EmailField />
      );
    }, [isFormLoading]);

    const passwordField = useMemo(() => {
      return isFormLoading ? (
        <TextInput
          hasFloatingLabel
          isLoading
          label="Password"
          type="password"
        />
      ) : (
        <PasswordField />
      );
    }, [isFormLoading]);

    const confirmPasswordField = useMemo(() => {
      return isNewUser ? <ConfirmPassword /> : null;
    }, [isNewUser]);

    const actionButtons = useMemo(() => {
      return (
        <ActionButtons
          isExistingUser={isExistingUser}
          shouldDisableActionButtons={isUnchecked}
          shouldEnableSignIn={shouldEnableSignIn}
          shouldEnableSignUp={shouldEnableSignUp}
        />
      );
    }, [isExistingUser, isUnchecked, shouldEnableSignIn, shouldEnableSignUp]);

    return (
      <fieldset className={styles["fieldset"]}>
        {emailField}
        {passwordField}
        {confirmPasswordField}
        {actionButtons}
      </fieldset>
    );
  }
);

FormFields.displayName = "FormFields";

export { FormFields };
