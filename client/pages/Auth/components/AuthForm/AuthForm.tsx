import type { JSX } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Form as ReactRouterForm } from "react-router";

import { BaseCard } from "@client/components/BaseCard";

import styles from "./AuthForm.module.scss";
import { FormActions } from "./components/FormActions/FormActions.tsx";
import { FormFields } from "./components/FormFields/FormFields.tsx";
import { AUTH_FORM_INITIAL_VALUES } from "./constants/auth-form.constant.ts";
import { useAuthSubmit } from "./hooks/useAuthSubmit.ts";
import type { AuthFormData } from "./types/auth-form.type.ts";

const AuthForm = (): JSX.Element => {
  const formMethods = useForm<AuthFormData>(AUTH_FORM_INITIAL_VALUES);

  const { onValid } = useAuthSubmit(formMethods);

  return (
    <section aria-label="Auth form" className={styles["form-wrapper"]}>
      <BaseCard
        cardClassName={styles["form-card"]}
        contentClassName={styles["content"]}
      >
        <FormProvider {...formMethods}>
          <ReactRouterForm
            noValidate
            onSubmit={formMethods.handleSubmit(onValid)}
          >
            <fieldset className={styles["fieldset"]}>
              <FormFields />
              <FormActions />
            </fieldset>
          </ReactRouterForm>
        </FormProvider>
      </BaseCard>
    </section>
  );
};

export { AuthForm };
