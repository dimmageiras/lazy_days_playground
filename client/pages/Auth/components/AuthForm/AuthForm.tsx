import type { JSX } from "react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { BaseCard } from "@client/components/BaseCard";
import { useEmailExistence } from "@client/services/user/mutations/useEmailExistence.mutation";

import { FormFields } from "./components/FormFields";
import { AUTH_FORM_INITIAL_VALUES } from "./constants/auth-form.constant";
import type { AuthFormData } from "./types/auth-form.type";

const AuthForm = (): JSX.Element => {
  const [isFormLoading, setIsFormLoading] = useState(true);
  const { isExistingUser, isNewUser, isUnchecked } = useEmailExistence();

  const formMethods = useForm<AuthFormData>({
    ...AUTH_FORM_INITIAL_VALUES,
    disabled: isFormLoading,
  });

  const isLoading =
    formMethods.formState.isSubmitting || !formMethods.formState.isReady;

  const onValid = async (data: AuthFormData) => {
    await Promise.resolve(data);

    formMethods.reset();
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isLoading && (isExistingUser || isNewUser)) {
      if (isExistingUser && formMethods.getValues("mode") !== "signin") {
        formMethods.setValue("mode", "signin");
      }

      if (isNewUser && formMethods.getValues("mode") !== "signup") {
        formMethods.setValue("mode", "signup");
      }
    }

    setIsFormLoading(false);
  }, [isLoading, isNewUser, formMethods, isExistingUser]);

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
