import type { JSX } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import type { SigninForm } from "@client/pages/Signin/components/Form/types/signin.type";

const PasswordField = (): JSX.Element => {
  const {
    field,
    fieldState: { error },
  } = useController<SigninForm, "password">({
    name: "password",
  });

  return (
    <>
      <label htmlFor="password">password</label>
      <TextInput id="password" {...field} type="password" />
      {error ? <span role="alert">{error.message}</span> : null}
    </>
  );
};

export { PasswordField };
