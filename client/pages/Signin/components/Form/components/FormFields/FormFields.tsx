import classNames from "classnames";
import type { JSX } from "react";
import { memo, useCallback, useMemo } from "react";

import { ListRenderer } from "@client/components/ListRenderer";
import { DomEventsHelper } from "@client/helpers/dom-events.helper";
import { ObjectUtilsHelper } from "@client/helpers/object-utils.helper";
import type { SigninForm } from "@client/pages/Signin/components/Form/types/signin-form.type";

import { Field } from "./components/Field";
import { FORM_FIELDS } from "./constants/form-fields.constant";
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
    const { getObjectEntries } = ObjectUtilsHelper;
    const formFields = useMemo(() => getObjectEntries(FORM_FIELDS), []);

    const getAutoFocus = useCallback(
      (name: keyof SigninForm) => {
        if (isFieldsetDisabled) {
          return false;
        }

        return name === FORM_FIELDS.EMAIL.name;
      },
      [isFieldsetDisabled]
    );

    return (
      <fieldset className={styles["fieldset"]} disabled={isFieldsetDisabled}>
        <ListRenderer
          data={formFields}
          getKey={([key]): keyof typeof FORM_FIELDS => key}
          renderComponent={({ data: [key, value] }): JSX.Element => (
            <Field
              key={key}
              label={value.label}
              name={value.name}
              shouldAutoFocus={getAutoFocus(value.name)}
            />
          )}
        />
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
