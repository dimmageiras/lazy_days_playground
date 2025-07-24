import classNames from "classnames";
import type { ChangeEvent, JSX } from "react";
import { useRef } from "react";

import styles from "./RadioButton.module.scss";

interface RadioButtonProps {
  id: string;
  className?: string;
  isChecked: boolean;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}

const RadioButton = ({
  id,
  className,
  isChecked = false,
  label,
  name,
  onChange,
  value,
}: RadioButtonProps): JSX.Element => {
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
      className={classNames(styles["radio-button"], className)}
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
        type="radio"
        value={value}
      />
      <span
        aria-hidden="true"
        className={styles["indicator"]}
        ref={indicatorRef}
        {...(isChecked && { "data-checked": "" })}
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
