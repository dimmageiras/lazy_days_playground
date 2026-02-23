import type { JSX } from "react";
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
  EMAIL: { name: EMAIL_FIELD_NAME, label: EMAIL_FIELD_LABEL },
} = FORM_FIELDS;
const { CHECK_EMAIL } = FORM_MODES;

const EmailField = (): JSX.Element => {
  const formMethods = useFormContext<AuthFormData>();
  const mode = useWatch({ control: formMethods.control, name: "mode" });
  const {
    field: fieldProps,
    fieldState: { error },
  } = useController<AuthFormData, typeof EMAIL_FIELD_NAME>({
    name: EMAIL_FIELD_NAME,
  });

  const isRequired = useFieldRequired(EMAIL_FIELD_NAME);

  useAuthFieldFocus();

  return (
    <TextInput
      // TO-DO: Add webauthn support
      autoComplete="email"
      disabled={mode !== CHECK_EMAIL}
      errorMessage={error?.message}
      hasFloatingLabel
      label={EMAIL_FIELD_LABEL}
      required={isRequired}
      type="email"
      {...fieldProps}
    />
  );
};

export { EmailField };
