import type { Route } from "@rr/types/client/pages/Auth/+types";
import type { data } from "react-router";

import { AUTH_FORM_MODES } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import { authFormSchema } from "@client/pages/Auth/components/AuthForm/schemas/auth-form.schema";
import type { CheckEmailSuccess } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";

import { AuthFormSubmitActionHelper } from "./helpers/auth-form-submit-action.helper";

const {
  CHECK_EMAIL: CHECK_EMAIL_MODE,
  SIGNIN: SIGNIN_MODE,
  SIGNUP: SIGNUP_MODE,
} = AUTH_FORM_MODES;

const { runCheckEmail, runSignin, runSignup } = AuthFormSubmitActionHelper;

const authFormSubmitAction = async ({
  request,
}: Route.ActionArgs): Promise<
  | ReturnType<
      typeof data<{
        defaultValues: CheckEmailSuccess;
      }>
    >
  | Response
> => {
  const formData = await request.formData();
  const formValues = Object.fromEntries(formData);

  const parsedFormValues = authFormSchema.safeParse(formValues);

  if (!parsedFormValues.success) {
    throw new Error("Invalid form data");
  }

  const parsedData = parsedFormValues.data;

  switch (parsedData.mode) {
    case CHECK_EMAIL_MODE:
      return runCheckEmail(parsedData);
    case SIGNIN_MODE:
      return runSignin(parsedData);
    case SIGNUP_MODE:
      return runSignup(parsedData);
    default:
      throw new Error("Unknown auth mode");
  }
};

export { authFormSubmitAction };
