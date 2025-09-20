import { zodResolver } from "@hookform/resolvers/zod";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import type { UseFormProps } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { BaseCard } from "@client/components/BaseCard";
import { signinRequestSchema } from "@shared/schemas/auth/signin-route.schema";

import { FormFields } from "./components/FormFields";
import type { SigninFormData } from "./types/auth-form.type";

const AuthForm = (): JSX.Element => {
  const [isFormLoading, setIsFormLoading] = useState(true);
  const formInitialization = useMemo(
    () =>
      ({
        defaultValues: {
          email: "",
          password: "",
        },
        disabled: isFormLoading,
        mode: "onTouched",
        progressive: true,
        resolver: zodResolver(signinRequestSchema),
        shouldUseNativeValidation: false,
      } satisfies UseFormProps<SigninFormData>),
    [isFormLoading]
  );

  const formMethods = useForm<SigninFormData>(formInitialization);

  const {
    formState: { isReady, isValid, isSubmitting },
    handleSubmit,
    reset,
  } = formMethods;

  const isLoading = isSubmitting || !isReady;

  const onValid = async (data: SigninFormData) => {
    await Promise.resolve(data);

    reset();
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
        <ReactRouterForm noValidate onSubmit={handleSubmit(onValid)}>
          <FormFields isFormLoading={isFormLoading} isFormValid={isValid} />
        </ReactRouterForm>
      </FormProvider>
    </BaseCard>
  );
};

export { AuthForm };
