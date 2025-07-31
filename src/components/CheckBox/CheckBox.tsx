import classNames from "classnames";
import type { ChangeEvent, JSX, Ref } from "react";

import { IconifyIcon } from "~/components/IconifyIcon";

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
 * const [isSubscribed, setIsSubscribed] = useState(false);
 *
 * <CheckBox
 *   id="newsletter-subscription"
 *   isChecked={isSubscribed}
 *   label="Subscribe to newsletter"
 *   name="newsletter"
 *   value="subscribed"
 *   onChange={(e) => setIsSubscribed(e.target.checked)}
 * />
 * ```
 *
 * @param props - The CheckBox component props
 * @param props.id - Unique identifier for the checkbox
 * @param props.className - Additional CSS classes
 * @param props.inputRef - Ref for the input element
 * @param props.isChecked - Checked state (defaults to false)
 * @param props.label - Label text
 * @param props.name - Form field name
 * @param props.onChange - Change handler
 * @param props.value - Form field value
 * @returns JSX.Element - The rendered checkbox component
 */
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
