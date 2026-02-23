import type { JSX } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import { useAuthFieldFocus } from "@client/pages/Auth/components/AuthForm/components/FormFields/hooks/useFieldFocus";
import { useFieldRequired } from "@client/pages/Auth/components/AuthForm/components/FormFields/hooks/useFieldRequired";
import { FORM_FIELDS } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import type { AuthFormData } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";

const {
  CONFIRM_PASSWORD: {
    name: CONFIRM_PASSWORD_FIELD_NAME,
    label: CONFIRM_PASSWORD_FIELD_LABEL,
  },
} = FORM_FIELDS;

const ConfirmPasswordField = (): JSX.Element => {
  const {
    field: fieldProps,
    fieldState: { error },
  } = useController<AuthFormData, typeof CONFIRM_PASSWORD_FIELD_NAME>({
    defaultValue: "",
    name: CONFIRM_PASSWORD_FIELD_NAME,
  });

  const isRequired = useFieldRequired(CONFIRM_PASSWORD_FIELD_NAME);

  useAuthFieldFocus();

  return (
    <TextInput
      // TO-DO: Add webauthn support
      autoComplete="new-password"
      errorMessage={error?.message}
      hasFloatingLabel
      label={CONFIRM_PASSWORD_FIELD_LABEL}
      required={isRequired}
      type="password"
      {...fieldProps}
    />
  );
};

export { ConfirmPasswordField };
