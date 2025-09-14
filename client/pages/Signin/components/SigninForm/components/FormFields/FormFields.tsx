import classNames from "classnames";
import type { JSX } from "react";
import { memo } from "react";

import { DomEventsHelper } from "@client/helpers/dom-events.helper";

import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";
import styles from "./FormFields.module.scss";

interface FormFieldsProps {
  isFieldsetDisabled: boolean;
  isSignInButtonDisabled: boolean;
  isSignUpButtonDisabled: boolean;
}

const FormFields = memo(
  ({
    isFieldsetDisabled,
    isSignInButtonDisabled,
    isSignUpButtonDisabled,
  }: FormFieldsProps): JSX.Element => {
    const { handleMouseDown } = DomEventsHelper;

    return (
      <fieldset className={styles["fieldset"]} disabled={isFieldsetDisabled}>
        <EmailField isDisabled={isFieldsetDisabled} />
        <PasswordField />
        <div className={styles["action-buttons"]}>
          <button
            className={classNames(styles["submit"], styles["sign-up"])}
            disabled={isSignUpButtonDisabled}
            onMouseDown={handleMouseDown}
            type="submit"
          >
            Sign up
          </button>
          <button
            className={classNames(styles["submit"], styles["sign-in"])}
            disabled={isSignInButtonDisabled}
            onMouseDown={handleMouseDown}
            type="submit"
          >
            Sign in
          </button>
        </div>
      </fieldset>
    );
  }
);

FormFields.displayName = "FormFields";

export { FormFields };
