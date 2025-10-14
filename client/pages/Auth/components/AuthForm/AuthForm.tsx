import type { JSX } from "react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { BaseCard } from "@client/components/BaseCard";
import { useEmailExistence } from "@client/services/user/mutations/useEmailExistence.mutation";

import { FormFields } from "./components/FormFields";
import { FORM_TYPES } from "./components/FormFields/constants/form-fields.constant";
import { AUTH_FORM_INITIAL_VALUES } from "./constants/auth-form.constant";
import type { AuthFormData } from "./types/auth-form.type";

const { SIGNIN, SIGNUP } = FORM_TYPES;

const AuthForm = (): JSX.Element => {
  const [wasLoadingBefore, setWasLoadingBefore] = useState(true);
  const { isExistingUser, isNewUser, isUnchecked } = useEmailExistence();

  const formMethods = useForm<AuthFormData>({
    ...AUTH_FORM_INITIAL_VALUES,
    disabled: wasLoadingBefore,
  });

  const { getValues, setValue } = formMethods;

  const isLoading =
    formMethods.formState.isSubmitting || !formMethods.formState.isReady;

  const isFormLoading = isLoading || wasLoadingBefore;

  const onValid = async (data: AuthFormData) => {
    await Promise.resolve(data);

    formMethods.reset();
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const mode = getValues("mode");

    if (isExistingUser && mode !== SIGNIN) {
      setValue("mode", SIGNIN);
    }

    if (isNewUser && mode !== SIGNUP) {
      setValue("mode", SIGNUP);
    }
  }, [getValues, isExistingUser, isLoading, isNewUser, setValue]);

  if (wasLoadingBefore && !isLoading) {
    setWasLoadingBefore(false);
  }

  return (
    <BaseCard>
      <FormProvider {...formMethods}>
        <ReactRouterForm
          noValidate
          onSubmit={formMethods.handleSubmit(onValid)}
        >
          <FormFields
            isExistingUser={isExistingUser}
            isFormLoading={isFormLoading}
            isFormValid={formMethods.formState.isValid}
            isNewUser={isNewUser}
            isUnchecked={isUnchecked}
          />
        </ReactRouterForm>
      </FormProvider>
    </BaseCard>
  );
};

export { AuthForm };
