import type { JSX } from "react";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import {
  Form as ReactRouterForm,
  useLocation,
  useNavigate,
} from "react-router";

import { BaseCard } from "@client/components/BaseCard";
import { IS_EXISTING_USER } from "@client/constants/user.constant";
import { ROUTES_CONSTANTS } from "@client/routes/constants/routes.constant";
import { useEmailExistence } from "@client/services/user/mutations/useEmailExistence.mutation";
import type { AuthFormData } from "@client/types/auth.type";

import styles from "./AuthForm.module.scss";
import { FormActions } from "./components/FormActions/FormActions.tsx";
import { FormFields } from "./components/FormFields/FormFields.tsx";
import { AUTH_FORM_INITIAL_VALUES } from "./constants/auth-form.constant.ts";
import { useAuthFormSubmit } from "./hooks/useAuthFormSubmit.ts";

const { AUTH_PATHS, ROUTE_PATHS } = ROUTES_CONSTANTS;
const { SIGNIN, SIGNUP } = AUTH_PATHS;
const { AUTH } = ROUTE_PATHS;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const AuthForm = (): JSX.Element | null => {
  const formMethods = useForm<AuthFormData>(AUTH_FORM_INITIAL_VALUES);
  const currentEmail =
    useWatch({
      control: formMethods.control,
      name: "email",
    }) ?? "";
  const location = useLocation();
  const navigate = useNavigate();
  const { isExistingUser, email: checkedEmail } = useEmailExistence();

  const locationState: { isAuthCheckEmailComplete?: boolean } | null =
    location.state;
  const hasCompletedRouteTransition =
    locationState?.isAuthCheckEmailComplete === true;

  const isSubPath =
    location.pathname === `/${AUTH}/${SIGNIN}` ||
    location.pathname === `/${AUTH}/${SIGNUP}`;
  const hasCompletedCheckEmail =
    checkedEmail != null &&
    isExistingUser !== IS_EXISTING_USER.NULL &&
    normalizeEmail(checkedEmail) === normalizeEmail(currentEmail);
  const shouldRedirect =
    isSubPath && !hasCompletedCheckEmail && !hasCompletedRouteTransition;

  useEffect(() => {
    if (shouldRedirect) {
      navigate(`/${AUTH}`, { replace: true });
    }
  }, [navigate, shouldRedirect]);

  const { onValid } = useAuthFormSubmit(formMethods);

  if (shouldRedirect) {
    return null;
  }

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
