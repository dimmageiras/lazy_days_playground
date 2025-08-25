import type { JSX } from "react";
import { useController } from "react-hook-form";

import { TextInput } from "@client/components/TextInput";
import type { SigninForm } from "@client/pages/Signin/components/Form/types/signin.type";

const EmailField = (): JSX.Element => {
  const {
    field,
    fieldState: { error },
  } = useController<SigninForm, "email">({
    name: "email",
  });

  return (
    <>
      <label htmlFor="email">email</label>
      <TextInput id="email" {...field} type="email" />
      {error ? <span role="alert">{error.message}</span> : null}
    </>
  );
};

export { EmailField };
