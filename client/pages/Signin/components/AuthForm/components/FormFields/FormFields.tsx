import { useMutationState } from "@tanstack/react-query";
import type { JSX } from "react";
import { memo } from "react";

import { USER_QUERY_KEYS } from "@client/api/user/user.constant";
import { TextInput } from "@client/components/TextInput";
import type { CheckEmailResponse } from "@shared/types/user.type";

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
    const emailExists = useMutationState({
      filters: { mutationKey: USER_QUERY_KEYS.CHECK_EMAIL },
      select: (mutation) => {
        const data = mutation.state.data as CheckEmailResponse | undefined;

        return data?.exists ?? null;
      },
    })[0];

    const isExistingUser = emailExists === true;
    const isNotExistingUser = emailExists === false;
    const shouldDisableActionButtons = emailExists === null;
    const shouldEnableSignIn = isFormValid && isExistingUser;
    const shouldEnableSignUp = isFormValid && isNotExistingUser;

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
        {isNotExistingUser ? <ConfirmPassword /> : null}
        <ActionButtons
          isExistingUser={isExistingUser}
          shouldDisableActionButtons={shouldDisableActionButtons}
          shouldEnableSignIn={shouldEnableSignIn}
          shouldEnableSignUp={shouldEnableSignUp}
        />
      </fieldset>
    );
  }
);

FormFields.displayName = "FormFields";

export { FormFields };
