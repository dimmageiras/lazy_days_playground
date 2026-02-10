import classNames from "classnames";
import type { ChangeEvent, JSX, Ref } from "react";
import { memo } from "react";

import styles from "./RadioButton.module.scss";

/**
 * Props interface for the RadioButton component.
 * Provides type safety for all required and optional radio button functionality.
 */
interface RadioButtonProps {
  /** Additional CSS classes for custom styling */
  className?: string;
  /** Unique identifier for the radio button (used for label association) */
  id: string;
  /** Optional ref for direct access to the input element */
  inputRef?: Ref<HTMLInputElement>;
  /** Whether the radio button is currently selected */
  isChecked: boolean;
  /** The text label displayed next to the radio button */
  label: string;
  /** Group name for the radio button set (must be same for related options) */
  name: string;
  /** Handler function called when the radio button selection changes */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** The value submitted with the form when this option is selected */
  value: string;
}

/**
 * An accessible and styled radio button component with consistent form handling and visual feedback.
 * The component is optimized for performance using React.memo to prevent unnecessary re-renders
 * when props haven't changed. Features proper label association and keyboard navigation support.
 *
 * @example
 * ```tsx
 * // Basic radio button
 * <RadioButton
 *   id="plan-basic"
 *   isChecked={selectedPlan === 'basic'}
 *   label="Basic Plan"
 *   name="subscription-plan"
 *   onChange={(event) => setSelectedPlan(event.target.value)}
 *   value="basic"
 * />
 *
 * // With custom styling and ref
 * <RadioButton
 *   className="premium-radio"
 *   id="plan-premium"
 *   inputRef={inputRef}
 *   isChecked={selectedPlan === 'premium'}
 *   label="Premium Plan"
 *   name="subscription-plan"
 *   onChange={(event) => setSelectedPlan(event.target.value)}
 *   value="premium"
 * />
 * ```
 *
 * @param props - The RadioButton component props
 * @param props.className - Additional CSS classes for custom styling (optional)
 * @param props.id - Unique identifier for the radio button
 * @param props.inputRef - Optional ref for direct access to the input element
 * @param props.isChecked - Whether the radio button is currently selected (default: false)
 * @param props.label - The text label displayed next to the radio button
 * @param props.name - Group name for the radio button set
 * @param props.onChange - Handler function called when selection changes
 * @param props.value - The value submitted with the form when selected
 * @returns JSX.Element - The rendered radio button with associated label
 */
const RadioButton = memo(
  ({
    className,
    id,
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
  },
);

RadioButton.displayName = "RadioButton";

export { RadioButton };
