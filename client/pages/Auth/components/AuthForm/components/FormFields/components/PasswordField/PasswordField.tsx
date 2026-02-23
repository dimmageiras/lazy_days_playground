import type { ChangeEvent, JSX } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import { useAuthFieldFocus } from "@client/pages/Auth/components/AuthForm/components/FormFields/hooks/useFieldFocus";
import { useFieldRequired } from "@client/pages/Auth/components/AuthForm/components/FormFields/hooks/useFieldRequired";
import {
  FORM_FIELDS,
  FORM_MODES,
} from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import type { AuthFormData } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";

const {
  CONFIRM_PASSWORD: { name: CONFIRM_PASSWORD_FIELD_NAME },
  PASSWORD: { name: PASSWORD_FIELD_NAME, label: PASSWORD_FIELD_LABEL },
} = FORM_FIELDS;
const { SIGNUP } = FORM_MODES;

const PasswordField = (): JSX.Element => {
  const formMethods = useFormContext<AuthFormData>();
  const mode = useWatch({ control: formMethods.control, name: "mode" });
  const {
    field: { onChange, ...fieldProps },
    fieldState: { error },
  } = useController<AuthFormData, typeof PASSWORD_FIELD_NAME>({
    defaultValue: "",
    name: PASSWORD_FIELD_NAME,
  });

  const isRequired = useFieldRequired(PASSWORD_FIELD_NAME);

  const autoComplete = mode === SIGNUP ? "new-password" : "current-password";

  const handlePasswordChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    onChange(event);

    if (mode !== SIGNUP) {
      return;
    }

    const {
      error: confirmPasswordError,
      invalid,
      isTouched,
    } = formMethods.getFieldState(CONFIRM_PASSWORD_FIELD_NAME);
    const hasConfirmPasswordBeenValidated =
      isTouched || invalid || !!confirmPasswordError;

    if (hasConfirmPasswordBeenValidated) {
      await formMethods.trigger(CONFIRM_PASSWORD_FIELD_NAME);
    }
  };

  useAuthFieldFocus();

  return (
    <TextInput
      // TO-DO: Add webauthn support
      autoComplete={autoComplete}
      errorMessage={error?.message}
      hasFloatingLabel
      label={PASSWORD_FIELD_LABEL}
      onChange={handlePasswordChange}
      required={isRequired}
      type="password"
      {...fieldProps}
    />
  );
};

export { PasswordField };
