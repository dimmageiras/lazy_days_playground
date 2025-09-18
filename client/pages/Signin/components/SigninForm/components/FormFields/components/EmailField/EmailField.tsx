import type { FocusEvent, JSX } from "react";
import { useCallback, useEffect, useMemo } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";
import { useCheckEmailExists } from "@client/pages/Signin/components/SigninForm/components/FormFields/components/EmailField/queries/useCheckEmailExists.query";
import { FORM_FIELDS } from "@client/pages/Signin/components/SigninForm/components/FormFields/constants/form-fields.constant";
import { signinSchema } from "@client/pages/Signin/components/SigninForm/schemas/signin-form.schema";
import type { SigninForm } from "@client/pages/Signin/components/SigninForm/types/signin-form.type";
import { zEmail } from "@shared/wrappers/zod.wrapper";

const {
  EMAIL: { name, label },
} = FORM_FIELDS;
const EMAIL_FIELD_NAME = name;
const EMAIL_FIELD_LABEL = label;

const EmailField = (): JSX.Element => {
  const {
    field: { onBlur, ...fieldProps },
    fieldState: { error },
  } = useController<SigninForm, typeof EMAIL_FIELD_NAME>({
    name: EMAIL_FIELD_NAME,
  });

  const { mutateAsync: checkEmailExists } = useCheckEmailExists();

  const { isFieldRequired } = FormUtilsHelper;

  const isRequired = useMemo(
    () => isFieldRequired(signinSchema, EMAIL_FIELD_NAME),
    [isFieldRequired]
  );

  const handleEmailBlur = useCallback(
    async (event: FocusEvent<HTMLInputElement>) => {
      onBlur();

      if (zEmail().safeParse(event.target.value).success) {
        await checkEmailExists(event.target.value);
      }
    },
    [checkEmailExists, onBlur]
  );

  useEffect(() => {
    if (fieldProps.disabled) {
      return;
    }

    requestAnimationFrame(() => {
      const element = document.getElementById(EMAIL_FIELD_NAME);

      if (element) {
        element.focus();
      }
    });
  }, [fieldProps.disabled]);

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
