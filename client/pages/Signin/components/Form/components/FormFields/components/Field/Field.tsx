import type { JSX } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import type { SigninForm } from "@client/pages/Signin/components/Form/types/signin-form.type";

interface FieldProps {
  name: keyof SigninForm;
}

const Field = ({ name }: FieldProps): JSX.Element => {
  const {
    field,
    fieldState: { error },
  } = useController<SigninForm, typeof name>({
    name,
  });

  return (
    <>
      <label htmlFor={name}>{name}</label>
      <TextInput id={name} {...field} type={name} />
      {error ? <span role="alert">{error.message}</span> : null}
    </>
  );
};

export { Field };
