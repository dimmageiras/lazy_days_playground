import type { ComponentPropsWithRef, JSX } from "react";
import { memo, useMemo } from "react";

import { FormUtilsHelper } from "@client/helpers/form-utils.helper";

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
 * The component is optimized for performance using React.memo to prevent unnecessary re-renders.
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
 *   isRequired={true}
 *   label="Email"
 *   name="email"
 *   required
 *   type="email"
 * />
 *
 * // Secure password input with validation
 * <TextInput
 *   label="Password"
 *   name="password"
 *   required
 *   type="password"
 * />
 * ```
 *
 * @param props - Extends standard input props (except 'type' and 'required')
 * @param props.[...inputProps] - All standard input attributes are supported
 * @param props.errorMessage - Optional error message to display below the input
 * @param props.label - Label text for the input field
 * @param props.type - Must be one of: "text", "email", "password"
 * @returns JSX.Element - The rendered input group with label, input, and error message
 */
const TextInput = memo(
  ({ errorMessage, label, ...props }: TextInputProps): JSX.Element => {
    const { getNoAutofillProps } = FormUtilsHelper;

    const noAutofillProps = useMemo(() => getNoAutofillProps(), []);

    return (
      <div className={styles["text-input-container"]}>
        <label className={styles["label"]} htmlFor={props.name}>
          {label}
          {props.required ? (
            <span aria-hidden="true" className={styles["required"]}>
              &nbsp;*
            </span>
          ) : null}
        </label>
        <input
          className={styles["input"]}
          id={props.name}
          {...(!!errorMessage && {
            "aria-errormessage": `${props.name}-error`,
          })}
          {...(!!errorMessage && { "aria-invalid": "true" })}
          {...(!!props.disabled && { "aria-disabled": "true" })}
          {...(!!props.required && { "aria-required": "true" })}
          {...noAutofillProps}
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
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export { TextInput };
