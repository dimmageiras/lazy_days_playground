import classNames from "classnames";
import type { ChangeEvent, JSX, Ref } from "react";

import { IconifyIcon } from "~/components/IconifyIcon";

import styles from "./CheckBox.module.scss";

interface CheckBoxProps {
  id: string;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  isChecked: boolean;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}

const CheckBox = ({
  id,
  className,
  inputRef,
  isChecked = false,
  label,
  name,
  onChange,
  value,
}: CheckBoxProps): JSX.Element => {
  return (
    <label
      className={classNames(styles["check-box"], className)}
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
        type="checkbox"
        value={value}
      />
      {isChecked ? (
        <IconifyIcon
          className={styles["image"]}
          icon="streamline-sharp:check-solid"
        />
      ) : null}
      <span className={styles["label"]}>{label}</span>
    </label>
  );
};

export { CheckBox };
