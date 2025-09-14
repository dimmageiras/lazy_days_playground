import type { JSX } from "react";
import { useMemo } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { FORM_FIELDS } from "@client/pages/Signin/components/SigninForm/components/FormFields/constants/form-fields.constant";
import { signinSchema } from "@client/pages/Signin/components/SigninForm/schemas/signin-form.schema";
import type { SigninForm } from "@client/pages/Signin/components/SigninForm/types/signin-form.type";

const PASSWORD_FIELD_NAME = FORM_FIELDS.PASSWORD.name;
const PASSWORD_FIELD_LABEL = FORM_FIELDS.PASSWORD.label;

const PasswordField = (): JSX.Element => {
  const {
    field: fieldProps,
    fieldState: { error },
  } = useController<SigninForm, typeof PASSWORD_FIELD_NAME>({
    name: PASSWORD_FIELD_NAME,
  });

  const { isFieldRequired } = FormUtilsHelper;

  const isRequired = useMemo(
    () => isFieldRequired(signinSchema, PASSWORD_FIELD_NAME),
    []
  );

  return (
    <TextInput
      autoComplete="current-password webauthn"
      errorMessage={error?.message}
      hasFloatingLabel
      label={PASSWORD_FIELD_LABEL}
      required={isRequired}
      type={PASSWORD_FIELD_NAME}
      {...fieldProps}
    />
  );
};

export { PasswordField };
