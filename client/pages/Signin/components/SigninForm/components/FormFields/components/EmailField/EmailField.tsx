import type { FocusEvent, JSX } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useController } from "react-hook-form";

import { useCheckEmailExists } from "@client/api/user/useCheckEmailExists.query";
import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { FORM_FIELDS } from "@client/pages/Signin/components/SigninForm/components/FormFields/constants/form-fields.constant";
import { signinSchema } from "@client/pages/Signin/components/SigninForm/schemas/signin-form.schema";
import type { SigninForm } from "@client/pages/Signin/components/SigninForm/types/signin-form.type";

const {
  EMAIL: { name, label },
} = FORM_FIELDS;
const EMAIL_FIELD_NAME = name;
const EMAIL_FIELD_LABEL = label;

const EmailField = (): JSX.Element => {
  const {
    field: { onBlur, ...fieldProps },
    fieldState: { error, isDirty, isTouched },
  } = useController<SigninForm, typeof EMAIL_FIELD_NAME>({
    name: EMAIL_FIELD_NAME,
  });
  const { mutateAsync: checkEmailExists } = useCheckEmailExists();

  const { isFieldRequired } = FormUtilsHelper;

  const isRequired = useMemo(
    () => isFieldRequired(signinSchema, EMAIL_FIELD_NAME),
    [isFieldRequired]
  );

  const isFieldUsedOrDisabled = fieldProps.disabled || isDirty || isTouched;

  const handleEmailBlur = useCallback(
    async (event: FocusEvent<HTMLInputElement>): Promise<void> => {
      onBlur();

      const { value } = event.currentTarget;
      const emailSchema = Reflect.get(signinSchema.shape, "email");
      const isEmailValid = emailSchema.safeParse(value).success;

      if (isEmailValid && value.trim()) {
        await checkEmailExists(value);
      }
    },
    [checkEmailExists, onBlur]
  );

  useEffect(() => {
    if (isFieldUsedOrDisabled) {
      return;
    }

    requestAnimationFrame(() => {
      const element = document.getElementById(EMAIL_FIELD_NAME);

      if (element) {
        element.focus();
      }
    });
  }, [isFieldUsedOrDisabled]);

  return (
    <TextInput
      autoComplete="email webauthn"
      errorMessage={error?.message}
      hasFloatingLabel
      label={EMAIL_FIELD_LABEL}
      onBlur={handleEmailBlur}
      required={isRequired}
      type={EMAIL_FIELD_NAME}
      {...fieldProps}
    />
  );
};

export { EmailField };
