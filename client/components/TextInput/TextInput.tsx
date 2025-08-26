import type { ComponentPropsWithRef, JSX } from "react";

import { FormUtilsHelper } from "@client/helpers/form-utils.helper";

import styles from "./TextInput.module.scss";
import type { TextInputType } from "./types/text-input.type";

/**
 * Props interface for the TextInput component.
 * Extends standard input props while enforcing specific text-based input types.
 */
interface TextInputProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  /**
   * Type of text input to render:
   * - "email": Email input with email validation
   * - "password": Secure password input with password managers disabled
   * - "text": Standard text input
   */
  type: TextInputType;
}

/**
 * A styled text input component with enhanced security features and
 * built-in protection against unwanted password manager interference.
 *
 * Features:
 * - Type-safe input types (email, password, text)
 * - Password manager protection when needed
 * - Consistent styling across input types
 * - Preserves all standard input attributes
 *
 * @example
 * ```tsx
 * // Basic text input
 * <TextInput
 *   name="username"
 *   placeholder="Enter username"
 *   type="text"
 * />
 *
 * // Email input with validation
 * <TextInput
 *   name="email"
 *   required
 *   type="email"
 * />
 *
 * // Secure password input
 * <TextInput
 *   name="password"
 *   type="password"
 * />
 * ```
 *
 * @param props - Extends standard input props (except 'type')
 * @param props.[...inputProps] - All standard input attributes are supported
 * @param props.type - Must be one of: "text", "email", "password"
 * @returns JSX.Element - The rendered input element with applied styles and protections
 */
const TextInput = ({ ...props }: TextInputProps): JSX.Element => {
  const { disablePasswordManagers } = FormUtilsHelper;

  return (
    <input
      className={styles["text-input"]}
      {...disablePasswordManagers()}
      {...props}
    />
  );
};

export { TextInput };
