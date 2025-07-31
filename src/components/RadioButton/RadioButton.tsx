import classNames from "classnames";
import type { ChangeEvent, JSX, Ref } from "react";

import styles from "./RadioButton.module.scss";

/**
 * Props interface for the RadioButton component
 */
interface RadioButtonProps {
  /** Unique identifier for the radio button */
  id: string;
  /** Additional CSS classes */
  className?: string;
  /** Ref for the input element */
  inputRef?: Ref<HTMLInputElement>;
  /** Checked state */
  isChecked: boolean;
  /** Label text */
  label: string;
  /** Form field name (should be same for grouped radio buttons) */
  name: string;
  /** Change handler */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Form field value */
  value: string;
}

/**
 * A styled radio button component with consistent form handling and visual feedback.
 *
 * @example
 * ```tsx
 * const [selectedPlan, setSelectedPlan] = useState('');
 *
 * <RadioButton
 *   id="plan-basic"
 *   isChecked={selectedPlan === 'basic'}
 *   label="Basic Plan"
 *   name="subscription-plan"
 *   value="basic"
 *   onChange={(e) => setSelectedPlan(e.target.value)}
 * />
 * <RadioButton
 *   id="plan-premium"
 *   isChecked={selectedPlan === 'premium'}
 *   label="Premium Plan"
 *   name="subscription-plan"
 *   value="premium"
 *   onChange={(e) => setSelectedPlan(e.target.value)}
 * />
 * ```
 *
 * @param props - The RadioButton component props
 * @param props.id - Unique identifier for the radio button
 * @param props.className - Additional CSS classes
 * @param props.inputRef - Ref for the input element
 * @param props.isChecked - Checked state (defaults to false)
 * @param props.label - Label text
 * @param props.name - Form field name (should be same for grouped radio buttons)
 * @param props.onChange - Change handler
 * @param props.value - Form field value
 * @returns JSX.Element - The rendered radio button component
 */
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
