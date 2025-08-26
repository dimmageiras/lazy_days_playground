import { zodResolver } from "@hookform/resolvers/zod";
import type { JSX } from "react";
import { useMemo } from "react";
import type { UseFormProps } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { FormFields } from "./components/FormFields";
import { signinSchema } from "./schemas/signin-form.schema";
import type { SigninForm as SigninFormType } from "./types/signin-form.type";

const SigninForm = (): JSX.Element => {
  const formInitialization: UseFormProps<SigninFormType> = useMemo(
    () => ({
      defaultValues: {
        email: "",
        password: "",
      },
      mode: "onBlur",
      progressive: true,
      resolver: zodResolver(signinSchema),
      shouldUseNativeValidation: false,
    }),
    []
  );

  const formMethods = useForm<SigninFormType>(formInitialization);

  const {
    formState: { isSubmitting },
    handleSubmit,
    reset,
  } = formMethods;

  const onSubmit = async (data: SigninFormType) => {
    await Promise.resolve(data);

    reset();
  };

  return (
    <FormProvider {...formMethods}>
      <ReactRouterForm noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormFields isSubmitting={isSubmitting} />
      </ReactRouterForm>
    </FormProvider>
  );
};

export { SigninForm };
