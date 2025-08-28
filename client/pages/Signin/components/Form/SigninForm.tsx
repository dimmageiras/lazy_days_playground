import { zodResolver } from "@hookform/resolvers/zod";
import type { JSX } from "react";
import { useMemo } from "react";
import type { UseFormProps } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { Card } from "@client/components/Card";
import { FormUtilsHelper } from "@client/helpers/form-utils.helper";

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
    formState: { errors, isReady, isSubmitting },
    handleSubmit,
    reset,
    trigger,
  } = formMethods;

  const { hasFormErrors } = FormUtilsHelper;

  const hasErrors = useMemo(() => hasFormErrors(errors), [errors]);

  const onValid = async (data: SigninFormType) => {
    await Promise.resolve(data);

    reset();
  };

  const onInvalid = () => {
    trigger();
  };

  return (
    <Card>
      <FormProvider {...formMethods}>
        <ReactRouterForm noValidate onSubmit={handleSubmit(onValid, onInvalid)}>
          <FormFields
            isFieldsetDisabled={isSubmitting || !isReady}
            isSignInButtonDisabled={!!hasErrors}
            isSignUpButtonDisabled={!!hasErrors}
          />
        </ReactRouterForm>
      </FormProvider>
    </Card>
  );
};

export { SigninForm };
