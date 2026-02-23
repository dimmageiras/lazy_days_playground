import classNames from "classnames";
import type { JSX } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { IconifyIcon, iconifyIcons } from "@client/components/IconifyIcon";
import { FORM_MODES } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import type { AuthFormData } from "@client/pages/Auth/components/AuthForm/types/auth-form.type";

import styles from "./FormActions.module.scss";

const { CHECK_EMAIL, SIGNIN, SIGNUP } = FORM_MODES;

const FormActions = (): JSX.Element => {
  const formMethods = useFormContext<AuthFormData>();
  const mode = useWatch({ control: formMethods.control, name: "mode" });

  const { arrowLeft } = iconifyIcons;

  const isNotCheckEmailMode = mode !== CHECK_EMAIL;

  const getSubmitButtonText = (): string => {
    switch (mode) {
      case SIGNIN:
        return "Sign in";
      case SIGNUP:
        return "Sign up";

      default:
        return "Continue";
    }
  };

  const handleGoToCheckEmailMode = (): void => {
    formMethods.setValue("mode", CHECK_EMAIL);
  };

  return (
    <div className={styles["form-actions"]}>
      {isNotCheckEmailMode ? (
        <button
          aria-label="Try a different email address"
          className={classNames(styles["button"], styles["back"])}
          onClick={handleGoToCheckEmailMode}
          title="Try a different email address"
          type="button"
        >
          <IconifyIcon icon={arrowLeft} ssr />
        </button>
      ) : null}
      <button
        aria-label={getSubmitButtonText()}
        className={classNames(styles["button"], styles["submit"])}
        type="submit"
      >
        {getSubmitButtonText()}
      </button>
    </div>
  );
};

export { FormActions };
