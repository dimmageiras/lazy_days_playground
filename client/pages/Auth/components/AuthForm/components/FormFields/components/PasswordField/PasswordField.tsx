import type { ChangeEvent, JSX } from "react";
import { useCallback, useMemo } from "react";
import { useController, useFormContext } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import {
  FORM_FIELDS,
  FORM_TYPES,
} from "@client/pages/Auth/components/AuthForm/components/FormFields/constants/form-fields.constant";
import { authFormSchema } from "@client/pages/Auth/components/AuthForm/schemas/auth-form.schema";
import type { AuthFormData } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";

const {
  CONFIRM_PASSWORD: { name: confirmPasswordName },
  PASSWORD: { name, label },
} = FORM_FIELDS;
const PASSWORD_FIELD_NAME = name;
const PASSWORD_FIELD_LABEL = label;

const PasswordField = (): JSX.Element => {
  const { getFieldState, trigger, watch } = useFormContext<AuthFormData>();
  const {
    field: { onChange, ...fieldProps },
    fieldState: { error },
  } = useController<AuthFormData, typeof PASSWORD_FIELD_NAME>({
    name: PASSWORD_FIELD_NAME,
  });

  const { checkFieldIsRequiredInDiscriminatedUnion } = FormUtilsHelper;

  const mode = watch("mode");

  const isRequired = useMemo(
    () =>
      checkFieldIsRequiredInDiscriminatedUnion(
        authFormSchema,
        PASSWORD_FIELD_NAME,
        mode
      ),
    [checkFieldIsRequiredInDiscriminatedUnion, mode]
  );

  const handlePasswordChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const {
        isTouched,
        invalid,
        error: confirmPasswordError,
      } = getFieldState(confirmPasswordName);
      const isConfirmPasswordRequired = mode === FORM_TYPES.SIGNUP;
      const hasConfirmPasswordBeenValidated =
        isTouched || invalid || !!confirmPasswordError;

      onChange(event);

      if (isConfirmPasswordRequired && hasConfirmPasswordBeenValidated) {
        await trigger(confirmPasswordName);
      }
    },
    [getFieldState, mode, onChange, trigger]
  );

  return (
    <TextInput
      autoComplete="current-password webauthn"
      errorMessage={error?.message}
      hasFloatingLabel
      label={PASSWORD_FIELD_LABEL}
      onChange={handlePasswordChange}
      required={isRequired}
      type="password"
      {...fieldProps}
    />
  );
};

export { PasswordField };
