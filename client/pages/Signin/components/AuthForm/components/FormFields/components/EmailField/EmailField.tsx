import type { ChangeEvent, FocusEvent, JSX } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useController } from "react-hook-form";

import { useCheckEmailExists } from "@client/api/user/useEmailExistence.query";
import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { useDebounce } from "@client/hooks/useDebounce";
import { FORM_FIELDS } from "@client/pages/Signin/components/AuthForm/components/FormFields/constants/form-fields.constant";
import type { SigninFormData } from "@client/pages/Signin/components/AuthForm/types/auth-form.type";
import { TIMING } from "@shared/constants/timing.constant";
import { signinRequestSchema } from "@shared/schemas/auth/signin-route.schema";

import { EmailFieldHelper } from "./helpers/email-field.helper";

const {
  EMAIL: { name, label },
} = FORM_FIELDS;
const EMAIL_FIELD_NAME = name;
const EMAIL_FIELD_LABEL = label;

const EmailField = (): JSX.Element => {
  const {
    field: { onBlur, onChange, ...fieldProps },
    fieldState: { error, invalid, isDirty, isTouched },
  } = useController<SigninFormData, typeof EMAIL_FIELD_NAME>({
    name: EMAIL_FIELD_NAME,
  });
  const { isPending, mutateAsync: checkEmailExists } = useCheckEmailExists();

  const { checkEmailValidity, handleBlur, handleChange } = EmailFieldHelper;
  const { isFieldRequired } = FormUtilsHelper;

  const isRequired = useMemo(
    () => isFieldRequired(signinRequestSchema, EMAIL_FIELD_NAME),
    [isFieldRequired]
  );

  const hasBeenValidated = isTouched || invalid || !!error;
  const isFieldUsedOrDisabled = fieldProps.disabled || isDirty || isTouched;

  const debouncedEmailValidation = useDebounce(
    async (email: string): Promise<void> => {
      await checkEmailValidity(email, checkEmailExists);
    },
    TIMING.VALIDATION
  );

  const handleEmailChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      handleChange(event, onChange, debouncedEmailValidation, hasBeenValidated);
    },
    [debouncedEmailValidation, handleChange, hasBeenValidated, onChange]
  );

  const handleEmailBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      handleBlur(event, onBlur, checkEmailExists);
    },
    [checkEmailExists, handleBlur, onBlur]
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
      isLoading={isPending}
      label={EMAIL_FIELD_LABEL}
      onBlur={handleEmailBlur}
      onChange={handleEmailChange}
      required={isRequired}
      type="email"
      {...fieldProps}
    />
  );
};

export { EmailField };
