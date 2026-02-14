import type { JSX } from "react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  Form as ReactRouterForm,
  useNavigate,
  useSearchParams,
} from "react-router";

import { BaseCard } from "@client/components/BaseCard";
import { IS_EXISTING_USER } from "@client/constants/user.constants";
import { useSignin, useSignup } from "@client/services/auth";
import { useEmailExistence } from "@client/services/user";

import { FormFields } from "./components/FormFields";
import { FORM_TYPES } from "./components/FormFields/constants/form-fields.constant";
import { AUTH_FORM_INITIAL_VALUES } from "./constants/auth-form.constant";
import type { AuthFormData } from "./types/auth-form.type";

const { SIGNIN, SIGNUP } = FORM_TYPES;

const AuthForm = (): JSX.Element => {
  const [wasLoadingBefore, setWasLoadingBefore] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const signinMutation = useSignin();
  const signupMutation = useSignup();

  const isExistingUser = useEmailExistence();

  const formMethods = useForm<AuthFormData>({
    ...AUTH_FORM_INITIAL_VALUES,
    disabled: wasLoadingBefore,
  });

  const { getValues, setValue } = formMethods;

  const isLoading =
    formMethods.formState.isSubmitting || !formMethods.formState.isReady;

  const onValid = async (data: AuthFormData) => {
    if (data.mode === SIGNIN) {
      const { email, password } = data;

      await signinMutation.mutateAsync({ email, password });
    } else if (data.mode === SIGNUP) {
      const { confirmPassword, email, password } = data;

      await signupMutation.mutateAsync({ confirmPassword, email, password });
    }

    formMethods.reset();

    const redirectTo = searchParams.get("redirect") || "/";

    navigate(redirectTo, { replace: true });
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const mode = getValues("mode");

    if (isExistingUser === IS_EXISTING_USER.TRUE && mode !== SIGNIN) {
      setValue("mode", SIGNIN);
    }

    if (isExistingUser === IS_EXISTING_USER.FALSE && mode !== SIGNUP) {
      setValue("mode", SIGNUP);
    }
  }, [getValues, isExistingUser, isLoading, setValue]);

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
            isFormValid={formMethods.formState.isValid}
          />
        </ReactRouterForm>
      </FormProvider>
    </BaseCard>
  );
};

export { AuthForm };
