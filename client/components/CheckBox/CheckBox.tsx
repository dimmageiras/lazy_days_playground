import classNames from "classnames";
import type { ChangeEvent, JSX, Ref } from "react";

import { IconifyIcon, iconifyIcons } from "@client/components/IconifyIcon";

import styles from "./CheckBox.module.scss";

/**
 * Props interface for the CheckBox component
 */
interface CheckBoxProps {
  /** Unique identifier for the checkbox */
  id: string;
  /** Additional CSS classes */
  className?: string;
  /** Ref for the input element */
  inputRef?: Ref<HTMLInputElement>;
  /** Checked state */
  isChecked: boolean;
  /** Label text */
  label: string;
  /** Form field name */
  name: string;
  /** Change handler */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Form field value */
  value: string;
}

/**
 * A styled checkbox component with custom check mark icon and consistent form handling.
 *
 * @example
 * ```tsx
 * import { useState } from 'react';
 *
 * const [isSubscribed, setIsSubscribed] = useState(false);
 * const inputRef = useRef<HTMLInputElement>(null);
 *
 * <CheckBox
 *   className="custom-checkbox"
 *   id="newsletter-subscription"
 *   inputRef={inputRef}
 *   isChecked={isSubscribed}
 *   label="Subscribe to newsletter"
 *   name="newsletter"
 *   onChange={(e) => setIsSubscribed(e.target.checked)}
 *   value="subscribed"
 * />
 * ```
 *
 * @param props - The CheckBox component props
 * @param props.className - Additional CSS classes (optional)
 * @param props.id - Unique identifier for the checkbox
 * @param props.inputRef - Ref for the input element (optional)
 * @param props.isChecked - Checked state
 * @param props.label - Label text
 * @param props.name - Form field name
 * @param props.onChange - Change handler for checkbox state changes
 * @param props.value - Form field value
 * @returns JSX.Element - The rendered checkbox component
 */
const CheckBox = ({
  className,
  id,
  inputRef,
  isChecked = false,
  label,
  name,
  onChange,
  value,
}: CheckBoxProps): JSX.Element => {
  const { check } = iconifyIcons;

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
        <IconifyIcon className={styles["image"]} icon={check} ssr />
      ) : null}
      <span className={styles["label"]}>{label}</span>
    </label>
  );
};

export { CheckBox };
