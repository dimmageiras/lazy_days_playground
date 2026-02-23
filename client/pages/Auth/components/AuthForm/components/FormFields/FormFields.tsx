import type { JSX } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { FORM_MODES } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import type { AuthFormData } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";

import { ConfirmPasswordField } from "./components/ConfirmPasswordField/index.ts";
import { EmailField } from "./components/EmailField/index.ts";
import { PasswordField } from "./components/PasswordField/index.ts";
import styles from "./FormFields.module.scss";

const { CHECK_EMAIL, SIGNUP } = FORM_MODES;

const FormFields = (): JSX.Element => {
  const formMethods = useFormContext<AuthFormData>();
  const mode = useWatch({ control: formMethods.control, name: "mode" });

  const isNotCheckEmailMode = mode !== CHECK_EMAIL;
  const isSignupMode = mode === SIGNUP;

  return (
    <div className={styles["form-fields"]}>
      <EmailField />
      {isNotCheckEmailMode ? <PasswordField /> : null}
      {isSignupMode ? <ConfirmPasswordField /> : null}
    </div>
  );
};

export { FormFields };
