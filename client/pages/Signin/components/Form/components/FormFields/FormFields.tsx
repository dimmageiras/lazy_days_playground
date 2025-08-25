import type { JSX } from "react";
import { memo } from "react";

import { EmailField } from "./components/EmailField";
import { PasswordField } from "./components/PasswordField";

interface FormFieldsProps {
  isSubmitting: boolean;
}

const FormFields = memo(({ isSubmitting }: FormFieldsProps): JSX.Element => {
  return (
    <fieldset disabled={isSubmitting}>
      <EmailField />
      <PasswordField />
      <button type="submit">SUBMIT</button>
    </fieldset>
  );
});

FormFields.displayName = "FormFields";

export { FormFields };
