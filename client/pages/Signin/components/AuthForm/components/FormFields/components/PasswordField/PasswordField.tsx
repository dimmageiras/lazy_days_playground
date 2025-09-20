import type { JSX } from "react";
import { useMemo } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { FORM_FIELDS } from "@client/pages/Signin/components/AuthForm/components/FormFields/constants/form-fields.constant";
import type { SigninFormData } from "@client/pages/Signin/components/AuthForm/types/auth-form.type";
import { signinRequestSchema } from "@shared/schemas/auth/signin-route.schema";

const {
  PASSWORD: { name, label },
} = FORM_FIELDS;
const PASSWORD_FIELD_NAME = name;
const PASSWORD_FIELD_LABEL = label;

const PasswordField = (): JSX.Element => {
  const {
    field: fieldProps,
    fieldState: { error },
  } = useController<SigninFormData, typeof PASSWORD_FIELD_NAME>({
    name: PASSWORD_FIELD_NAME,
  });

  const { isFieldRequired } = FormUtilsHelper;

  const isRequired = useMemo(
    () => isFieldRequired(signinRequestSchema, PASSWORD_FIELD_NAME),
    [isFieldRequired]
  );

  return (
    <TextInput
      autoComplete="current-password webauthn"
      errorMessage={error?.message}
      hasFloatingLabel
      label={PASSWORD_FIELD_LABEL}
      required={isRequired}
      type="password"
      {...fieldProps}
    />
  );
};

export { PasswordField };
