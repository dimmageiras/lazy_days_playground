import type { AriaAttributes, HTMLInputAutoCompleteAttribute } from "react";
import type { FieldErrors } from "react-hook-form";
import type { KeyAsString } from "type-fest";

import type {
  ZodInfer,
  ZodObject,
  ZodString,
} from "@shared/wrappers/zod.wrapper";

import { ObjectUtilsHelper } from "./object-utils.helper";

/**
 * Generates props to prevent browser/password manager autofill on form inputs.
 * Supports multiple password managers: 1Password, Bitwarden, LastPass, Dashlane.
 *
 * @example
 * ```tsx
 * const noAutofillProps = getNoAutofillProps();
 *
 * <input
 *   type="password"
 *   {...noAutofillProps}
 * />
 * ```
 *
 * @returns Object containing various attributes to disable autofill across different managers
 */
const getNoAutofillProps = (): {
  "aria-autocomplete": AriaAttributes["aria-autocomplete"];
  "data-1p-ignore": boolean;
  "data-bwignore": boolean;
  "data-form-type": string;
  "data-lpignore": `${boolean}`;
  "data-op-ignore": boolean;
  autoComplete: HTMLInputAutoCompleteAttribute;
} => ({
  "aria-autocomplete": "none",
  autoComplete: "off",

  // 1Password
  "data-1p-ignore": true,
  "data-op-ignore": true,

  // Bitwarden
  "data-bwignore": true,

  // Dashlane
  "data-form-type": "other",

  // LastPass
  "data-lpignore": "true",
});

/**
 * Checks if a form has any validation errors by examining the errors object
 * from react-hook-form. More reliable than checking Object.keys(errors).length
 * as it handles nested form structures.
 *
 * @example
 * ```tsx
 * const {
 *   formState: { errors }
 * } = useForm<FormType>();
 *
 * const hasErrors = hasFormErrors(errors);
 *
 * // Use in component logic
 * <button disabled={hasErrors}>
 *   Submit
 * </button>
 * ```
 *
 * @param errors - The errors object from react-hook-form's formState
 * @returns True if the form has any validation errors, false otherwise
 */
const hasFormErrors = <TFormErrors extends FieldErrors>(
  errors: TFormErrors
): boolean => {
  const { getObjectKeys } = ObjectUtilsHelper;

  return getObjectKeys(errors).length > 0;
};

/**
 * Determines if a field is required based on its Zod schema validation.
 * Checks if the field's schema rejects undefined values.
 *
 * @example
 * ```tsx
 * const userSchema = z.object({
 *   email: z.string().email(),
 *   name: z.string().optional()
 * });
 *
 * isFieldRequired(userSchema, 'email'); // true
 * isFieldRequired(userSchema, 'name');  // false
 * ```
 *
 * @param schema - The Zod object schema containing the field
 * @param field - The name of the field to check
 * @returns True if the field is required, false otherwise
 */
const isFieldRequired = <TSchema extends ZodObject>(
  schema: TSchema,
  field: KeyAsString<ZodInfer<TSchema>>
): boolean => {
  const fieldSchema: ZodString = Reflect.get(schema.shape, field);

  return !fieldSchema.safeParse(undefined).success;
};

export const FormUtilsHelper = {
  getNoAutofillProps,
  hasFormErrors,
  isFieldRequired,
};
