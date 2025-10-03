import type { JSX } from "react";
import { useMemo } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { FORM_FIELDS } from "@client/pages/Auth/components/AuthForm/components/FormFields/constants/form-fields.constant";
import type { AuthFormData } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";
import { signupRequestSchema } from "@shared/schemas/auth/signup-route.schema";

const {
  CONFIRM_PASSWORD: { name, label },
} = FORM_FIELDS;
const CONFIRM_PASSWORD_FIELD_NAME = name;
const CONFIRM_PASSWORD_FIELD_LABEL = label;

const ConfirmPassword = (): JSX.Element => {
  const {
    field: fieldProps,
    fieldState: { error },
  } = useController<AuthFormData, typeof CONFIRM_PASSWORD_FIELD_NAME>({
    name: CONFIRM_PASSWORD_FIELD_NAME,
  });

  const { isFieldRequired } = FormUtilsHelper;

  const isRequired = useMemo(
    () => isFieldRequired(signupRequestSchema, CONFIRM_PASSWORD_FIELD_NAME),
    [isFieldRequired]
  );

  return (
    <TextInput
      autoComplete="current-password webauthn"
      errorMessage={error?.message}
      hasFloatingLabel
      label={CONFIRM_PASSWORD_FIELD_LABEL}
      required={isRequired}
      type="password"
      {...fieldProps}
    />
  );
};

export { ConfirmPassword };
