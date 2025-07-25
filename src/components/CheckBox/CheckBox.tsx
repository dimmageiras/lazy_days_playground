import classNames from "classnames";
import type { ChangeEvent, Ref } from "react";
import { type JSX, useRef } from "react";

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
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const handleBlur = () => {
    if (indicatorRef.current) {
      indicatorRef.current.removeAttribute("data-focus");
    }
  };

  const handleFocus = () => {
    if (indicatorRef.current) {
      indicatorRef.current.setAttribute("data-focus", "");
    }
  };

  const handleMouseEnter = () => {
    if (indicatorRef.current) {
      indicatorRef.current.setAttribute("data-hover", "");
    }
  };

  const handleMouseLeave = () => {
    if (indicatorRef.current) {
      indicatorRef.current.removeAttribute("data-hover");
    }
  };

  return (
    <label
      className={classNames(styles["check-box"], className)}
      htmlFor={id}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...(isChecked && { "data-checked": "" })}
    >
      <input
        checked={isChecked}
        className={styles["input"]}
        id={id}
        name={name}
        onBlur={handleBlur}
        onChange={onChange}
        onFocus={handleFocus}
        ref={inputRef}
        type="checkbox"
        value={value}
      />
      <span
        aria-hidden="true"
        className={styles["indicator"]}
        ref={indicatorRef}
        {...(isChecked && { "data-checked": "" })}
      >
        {isChecked ? (
          <div>
            <></>
          </div>
        ) : null}
      </span>
      <span
        className={styles["label"]}
        {...(isChecked && { "data-checked": "" })}
      >
        {label}
      </span>
    </label>
  );
};

export { CheckBox };
