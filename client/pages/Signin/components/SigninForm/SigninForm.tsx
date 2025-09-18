import { zodResolver } from "@hookform/resolvers/zod";
import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import type { UseFormProps } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { BaseCard } from "@client/components/BaseCard";

import { FormFields } from "./components/FormFields";
import { signinSchema } from "./schemas/signin-form.schema";
import type { SigninForm as SigninFormType } from "./types/signin-form.type";

const SigninForm = (): JSX.Element => {
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
        resolver: zodResolver(signinSchema),
        reValidateMode: "onChange",
        shouldUseNativeValidation: false,
      } satisfies UseFormProps<SigninFormType>),
    [isFormLoading]
  );

  const formMethods = useForm<SigninFormType>(formInitialization);

  const {
    formState: { isReady, isValid, isSubmitting },
    handleSubmit,
    reset,
  } = formMethods;

  const isLoading = useMemo(
    () => isSubmitting || !isReady,
    [isSubmitting, isReady]
  );

  const onValid = async (data: SigninFormType) => {
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

export { SigninForm };
