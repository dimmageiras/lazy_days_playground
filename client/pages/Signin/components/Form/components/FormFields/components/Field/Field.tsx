import type { JSX } from "react";
import { useEffect, useMemo } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { signinSchema } from "@client/pages/Signin/components/Form/schemas/signin-form.schema";
import type { SigninForm } from "@client/pages/Signin/components/Form/types/signin-form.type";

interface FieldProps {
  label: string;
  name: keyof SigninForm;
  shouldAutoFocus?: boolean;
}

const Field = ({
  label,
  name,
  shouldAutoFocus = false,
}: FieldProps): JSX.Element => {
  const {
    field: fieldProps,
    fieldState: { error },
  } = useController<SigninForm, typeof name>({
    name,
  });

  const { isFieldRequired } = FormUtilsHelper;

  const isRequired = useMemo(() => isFieldRequired(signinSchema, name), [name]);

  useEffect(() => {
    if (shouldAutoFocus) {
      document.getElementById(name)?.focus();
    }
  }, [name, shouldAutoFocus]);

  return (
    <TextInput
      errorMessage={error?.message}
      label={label}
      required={isRequired}
      type={name}
      {...fieldProps}
    />
  );
};

export { Field };
