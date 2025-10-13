import type { JSX } from "react";
import { memo, useMemo } from "react";

import { TextInput } from "@client/components/TextInput";

import { ActionButtons } from "./components/ActionButtons";
import { ConfirmPassword } from "./components/ConfirmPassword";
import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";
import { FORM_FIELDS } from "./constants/form-fields.constant";
import styles from "./FormFields.module.scss";

interface FormFieldsProps {
  isExistingUser: boolean;
  isFormLoading: boolean;
  isFormValid: boolean;
  isNewUser: boolean;
  isUnchecked: boolean;
}

const {
  EMAIL: { label: emailLabel },
  PASSWORD: { label: passwordLabel },
} = FORM_FIELDS;

const FormFields = memo(
  ({
    isExistingUser,
    isFormLoading,
    isFormValid,
    isNewUser,
    isUnchecked,
  }: FormFieldsProps): JSX.Element => {
    const shouldEnableSignIn = isFormValid && isExistingUser;
    const shouldEnableSignUp = isFormValid && isNewUser;

    const emailField = useMemo(() => {
      return isFormLoading ? (
        <TextInput hasFloatingLabel isLoading label={emailLabel} type="email" />
      ) : (
        <EmailField />
      );
    }, [isFormLoading]);

    const passwordField = useMemo(() => {
      return isFormLoading ? (
        <TextInput
          hasFloatingLabel
          isLoading
          label={passwordLabel}
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
