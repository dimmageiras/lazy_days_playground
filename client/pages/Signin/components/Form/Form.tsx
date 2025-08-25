import { zodResolver } from "@hookform/resolvers/zod";
import type { JSX } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { FormFields } from "./components/FormFields";
import { signinSchema } from "./schemas/signin.schema";
import type { SigninForm } from "./types/signin.type";

const Form = (): JSX.Element | null => {
  const formMethods = useForm<SigninForm>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
    resolver: zodResolver(signinSchema),
    shouldUseNativeValidation: false,
  });

  const {
    formState: { isReady, isSubmitting },
    handleSubmit,
    reset,
  } = formMethods;

  const onSubmit = async (data: SigninForm) => {
    await Promise.resolve(data);

    reset();
  };

  if (!isReady) {
    return null;
  }

  return (
    <FormProvider {...formMethods}>
      <ReactRouterForm noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormFields isSubmitting={isSubmitting} />
      </ReactRouterForm>
    </FormProvider>
  );
};

export { Form };
