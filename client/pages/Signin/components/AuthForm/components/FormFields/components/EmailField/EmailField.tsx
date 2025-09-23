import type { ChangeEvent, FocusEvent, JSX } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useController, useFormContext } from "react-hook-form";

import { useCheckEmailExists } from "@client/api/user/useEmailExistence.query";
import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { useDebounce } from "@client/hooks/useDebounce";
import { FORM_FIELDS } from "@client/pages/Signin/components/AuthForm/components/FormFields/constants/form-fields.constant";
import type { SignupFormData } from "@client/pages/Signin/components/AuthForm/types/auth-form.type";
import { TIMING } from "@shared/constants/timing.constant";
import { signupRequestSchema } from "@shared/schemas/auth/signup-route.schema";

import { EmailFieldHelper } from "./helpers/email-field.helper";

const {
  EMAIL: { name, label },
} = FORM_FIELDS;
const EMAIL_FIELD_NAME = name;
const EMAIL_FIELD_LABEL = label;
const { SECONDS_HALF_IN_MS } = TIMING;

const EmailField = (): JSX.Element => {
  const { setFocus } = useFormContext();
  const {
    field: { onBlur, onChange, ...fieldProps },
    fieldState: { error, invalid, isDirty, isTouched },
  } = useController<SignupFormData, typeof EMAIL_FIELD_NAME>({
    name: EMAIL_FIELD_NAME,
  });
  const { mutateAsync: checkEmailExists } = useCheckEmailExists();

  const { checkEmailValidity, handleBlur, handleChange } = EmailFieldHelper;
  const { isFieldRequired } = FormUtilsHelper;

  const isRequired = useMemo(
    () => isFieldRequired(signupRequestSchema, EMAIL_FIELD_NAME),
    [isFieldRequired]
  );

  const hasBeenValidated = isTouched || invalid || !!error;
  const isFieldUsedOrDisabled = fieldProps.disabled || isDirty || isTouched;

  const debouncedEmailValidation = useDebounce(
    async (email: string): Promise<void> => {
      await checkEmailValidity(email, checkEmailExists);
    },
    SECONDS_HALF_IN_MS
  );

  const handleEmailChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      handleChange(event, onChange, debouncedEmailValidation, hasBeenValidated);
    },
    [debouncedEmailValidation, handleChange, hasBeenValidated, onChange]
  );

  const handleEmailBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      handleBlur(event, onBlur, checkEmailExists, hasBeenValidated);
    },
    [checkEmailExists, handleBlur, hasBeenValidated, onBlur]
  );

  useEffect(() => {
    if (isFieldUsedOrDisabled) {
      return;
    }

    requestAnimationFrame(() => {
      setFocus(EMAIL_FIELD_NAME);
    });
  }, [isFieldUsedOrDisabled, setFocus]);

  return (
    <TextInput
      autoComplete="email webauthn"
      errorMessage={error?.message}
      hasFloatingLabel
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
