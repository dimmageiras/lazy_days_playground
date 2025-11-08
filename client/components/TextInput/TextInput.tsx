import classNames from "classnames";
import type { ComponentPropsWithRef, JSX } from "react";
import { useMemo } from "react";

import { FormUtilsHelper } from "@client/helpers/form-utils.helper";

import { SkeletonInput } from "./components/SkeletonInput";
import { SkeletonLabel } from "./components/SkeletonLabel";
import styles from "./TextInput.module.scss";
import type { TextInputType } from "./types/text-input.type";

/**
 * Props interface for the TextInput component.
 * Extends standard input props while enforcing specific text-based input types.
 */
interface TextInputProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  /**
   * Optional error message to display below the input.
   */
  errorMessage?: string | undefined;
  /**
   * Whether the label should float above the input when the input is focused or has content.
   */
  hasFloatingLabel?: boolean;
  /**
   * Whether the input is loading.
   */
  isLoading?: boolean;
  /**
   * The label text for the input field.
   */
  label: string;
  /**
   * Type of text input to render:
   * - "email": Email input with email validation
   * - "password": Secure password input with autofill disabled
   * - "text": Standard text input
   */
  type: TextInputType;
}

/**
 * A styled text input component with enhanced security features, built-in label,
 * error handling, and protection against unwanted autofill interference.
 *
 * @example
 * ```tsx
 * // Basic text input with label
 * <TextInput
 *   label="Username"
 *   name="username"
 *   placeholder="Enter username"
 *   required={false}
 *   type="text"
 * />
 *
 * // Required email input with error
 * <TextInput
 *   errorMessage="Invalid email format"
 *   label="Email"
 *   name="email"
 *   required
 *   type="email"
 * />
 *
 * // Floating label password input
 * <TextInput
 *   hasFloatingLabel
 *   label="Password"
 *   name="password"
 *   required
 *   type="password"
 * />
 * ```
 *
 * @param props - The TextInput component props
 * @param props.[...inputProps] - All standard input attributes are supported (except 'type')
 * @param props.errorMessage - Optional error message to display below the input
 * @param props.hasFloatingLabel - Whether the label should float above the input when focused or has content (default: false)
 * @param props.isLoading - Whether the input is loading (default: false)
 * @param props.label - Label text for the input field
 * @param props.type - Must be one of: "text", "email", "password"
 * @returns JSX.Element - The rendered input group with label, input, and error message
 */
const TextInput = ({
  autoComplete = "off",
  className,
  errorMessage,
  hasFloatingLabel = false,
  isLoading = false,
  label,
  ...props
}: TextInputProps): JSX.Element => {
  const { getNoAutofillProps } = FormUtilsHelper;

  const noAutofillProps = useMemo(
    () => (autoComplete === "off" ? getNoAutofillProps() : null),
    [autoComplete, getNoAutofillProps]
  );

  const hasErrorMessage = !!errorMessage;
  const isDisabled = !!props.disabled;
  const isRequired = !!props.required;

  return (
    <div className={styles["text-input-container"]}>
      {isLoading ? (
        <>
          {!hasFloatingLabel ? (
            <SkeletonLabel
              className={classNames(styles["label"], styles["skeleton"])}
              id={`${props.name ?? props.id}-unique-id-label`}
            />
          ) : null}
          <SkeletonInput
            className={classNames(
              styles["input"],
              styles["skeleton"],
              className
            )}
            id={`${props.name ?? props.id}-unique-id-input`}
          />
        </>
      ) : (
        <>
          <label
            className={classNames(styles["label"], {
              [String(styles["floating"])]: hasFloatingLabel,
            })}
            htmlFor={props.name}
          >
            {label}
            {props.required ? (
              <span aria-hidden="true" className={styles["required"]}>
                &nbsp;*
              </span>
            ) : null}
          </label>
          <input
            className={classNames(
              styles["input"],
              { [String(styles["has-value"])]: !!props.value },
              className
            )}
            id={props.name}
            {...(hasErrorMessage && {
              "aria-errormessage": `${props.name}-error`,
              "aria-invalid": "true",
            })}
            {...(isDisabled && { "aria-disabled": "true" })}
            {...(isRequired && { "aria-required": "true" })}
            {...(noAutofillProps ?? { autoComplete })}
            {...props}
          />
          {errorMessage ? (
            <small
              aria-live="polite"
              className={styles["error-message"]}
              id={`${props.name}-error`}
            >
              {errorMessage}
            </small>
          ) : null}
        </>
      )}
    </div>
  );
};

export { TextInput };
