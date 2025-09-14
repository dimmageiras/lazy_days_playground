import { zodResolver } from "@hookform/resolvers/zod";
import type { JSX } from "react";
import { useMemo } from "react";
import type { UseFormProps } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { BaseCard } from "@client/components/BaseCard";

import { FormFields } from "./components/FormFields";
import { signinSchema } from "./schemas/signin-form.schema";
import type { SigninForm as SigninFormType } from "./types/signin-form.type";

const SigninForm = (): JSX.Element => {
  const formInitialization = useMemo(
    () =>
      ({
        defaultValues: {
          email: "",
          password: "",
        },
        mode: "onTouched",
        progressive: true,
        resolver: zodResolver(signinSchema),
        shouldUseNativeValidation: false,
      } satisfies UseFormProps<SigninFormType>),
    []
  );

  const formMethods = useForm<SigninFormType>(formInitialization);

  const {
    formState: { isReady, isValid, isSubmitting },
    handleSubmit,
    reset,
  } = formMethods;

  const onValid = async (data: SigninFormType) => {
    await Promise.resolve(data);

    reset();
  };

  return (
    <BaseCard>
      <FormProvider {...formMethods}>
        <ReactRouterForm noValidate onSubmit={handleSubmit(onValid)}>
          <FormFields
            isFieldsetDisabled={isSubmitting || !isReady}
            isSignInButtonDisabled={!isValid}
            isSignUpButtonDisabled={!isValid}
          />
        </ReactRouterForm>
      </FormProvider>
    </BaseCard>
  );
};

export { SigninForm };
