import type { ComponentPropsWithRef, JSX } from "react";

import { FormUtilsHelper } from "@client/helpers/form-utils.helper";

import styles from "./TextInput.module.scss";
import type { TextInputType } from "./types/text-input.type";

interface TextInputProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  type: TextInputType;
}

const TextInput = ({ ...props }: TextInputProps): JSX.Element => {
  const { disablePasswordManagers } = FormUtilsHelper;

  return (
    <input
      className={styles["text-input"]}
      {...disablePasswordManagers()}
      {...props}
    />
  );
};

export { TextInput };
