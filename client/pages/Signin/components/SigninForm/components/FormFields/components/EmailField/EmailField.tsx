import type { JSX } from "react";
import { useEffect, useMemo } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { FORM_FIELDS } from "@client/pages/Signin/components/SigninForm/components/FormFields/constants/form-fields.constant";
import { signinSchema } from "@client/pages/Signin/components/SigninForm/schemas/signin-form.schema";
import type { SigninForm } from "@client/pages/Signin/components/SigninForm/types/signin-form.type";

interface EmailFieldProps {
  isDisabled: boolean;
}

const EMAIL_FIELD_NAME = FORM_FIELDS.EMAIL.name;
const EMAIL_FIELD_LABEL = FORM_FIELDS.EMAIL.label;

const EmailField = ({ isDisabled }: EmailFieldProps): JSX.Element => {
  const {
    field: fieldProps,
    fieldState: { error },
  } = useController<SigninForm, typeof EMAIL_FIELD_NAME>({
    name: EMAIL_FIELD_NAME,
  });

  const { isFieldRequired } = FormUtilsHelper;

  const isRequired = useMemo(
    () => isFieldRequired(signinSchema, EMAIL_FIELD_NAME),
    []
  );

  useEffect(() => {
    if (isDisabled) {
      return;
    }

    document.getElementById(EMAIL_FIELD_NAME)?.focus();
  }, [isDisabled]);

  return (
    <TextInput
      autoComplete="email webauthn"
      errorMessage={error?.message}
      hasFloatingLabel
      label={EMAIL_FIELD_LABEL}
      required={isRequired}
      type={EMAIL_FIELD_NAME}
      {...fieldProps}
    />
  );
};

export { EmailField };
