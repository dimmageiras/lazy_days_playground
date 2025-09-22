import type { JSX } from "react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { BaseCard } from "@client/components/BaseCard";

import { FormFields } from "./components/FormFields";
import { AUTH_FORM_INITIAL_VALUES } from "./constants/auth-form.constant";
import type { SignupFormData } from "./types/auth-form.type";

const AuthForm = (): JSX.Element => {
  const [isFormLoading, setIsFormLoading] = useState(true);
  const formMethods = useForm<SignupFormData>({
    ...AUTH_FORM_INITIAL_VALUES,
    disabled: isFormLoading,
  });

  const isLoading =
    formMethods.formState.isSubmitting || !formMethods.formState.isReady;

  const onValid = async (data: SignupFormData) => {
    await Promise.resolve(data);

    formMethods.reset();
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setIsFormLoading(false);
  }, [isLoading]);

  return (
    <BaseCard>
      <FormProvider {...formMethods}>
        <ReactRouterForm
          noValidate
          onSubmit={formMethods.handleSubmit(onValid)}
        >
          <FormFields
            isFormLoading={isFormLoading}
            isFormValid={formMethods.formState.isValid}
          />
        </ReactRouterForm>
      </FormProvider>
    </BaseCard>
  );
};

export { AuthForm };
