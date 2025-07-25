import classNames from "classnames";
import type { ChangeEvent, JSX, Ref } from "react";

import styles from "./RadioButton.module.scss";

interface RadioButtonProps {
  id: string;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  isChecked: boolean;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}

const RadioButton = ({
  id,
  className,
  inputRef,
  isChecked = false,
  label,
  name,
  onChange,
  value,
}: RadioButtonProps): JSX.Element => {
  return (
    <label
      className={classNames(styles["radio-button"], className)}
      htmlFor={id}
      {...(isChecked && { "data-checked": "" })}
    >
      <input
        checked={isChecked}
        className={styles["input"]}
        id={id}
        name={name}
        onChange={onChange}
        ref={inputRef}
        type="radio"
        value={value}
      />
      <span
        className={styles["label"]}
        {...(isChecked && { "data-checked": "" })}
      >
        {label}
      </span>
    </label>
  );
};

export { RadioButton };
