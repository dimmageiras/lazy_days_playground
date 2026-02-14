import type { AriaAttributes, HTMLInputAutoCompleteAttribute } from "react";
import type { FieldErrors } from "react-hook-form";
import type { KeyAsString } from "type-fest";

import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";
import type {
  ZodDiscriminatedUnion,
  ZodInfer,
  ZodObject,
} from "@shared/wrappers/zod.wrapper";

const { getObjectKeys, isObject } = ObjectUtilsHelper;

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
 * Retrieves a specific schema from a discriminated union based on a discriminator value.
 *
 * @example
 * ```tsx
 * const schema = getSchemaFromDiscriminatedUnion(authFormSchema, "signin");
 * ```
 *
 * @param schema - The discriminated union schema
 * @param discriminator - The discriminator value to match
 * @returns The matching schema or undefined if no match is found
 */
const getSchemaFromDiscriminatedUnion = <
  TSchema extends ZodDiscriminatedUnion<Array<ZodObject>>,
>(
  schema: TSchema,
  discriminator: ZodInfer<TSchema>["mode"],
): ZodObject | undefined => {
  return schema.def.options.find((option) => {
    const discriminatorKey: keyof ZodInfer<TSchema> = schema.def.discriminator;
    const discriminatorSchema: ZodObject = Reflect.get(
      option.shape,
      discriminatorKey,
    );

    return (
      "value" in discriminatorSchema &&
      discriminatorSchema.value === discriminator
    );
  });
};

/**
 * Checks if a field schema rejects undefined values.
 * Helper function used by field validation functions.
 *
 * @param fieldSchema - The Zod schema of the field
 * @returns True if the field is required, false otherwise
 */
const isFieldSchemaRequired = <TSchema extends ZodObject>(
  fieldSchema: TSchema,
): boolean => {
  const isZodObject = isObject(fieldSchema) && "safeParse" in fieldSchema;

  if (isZodObject) {
    return !fieldSchema.safeParse(undefined).success;
  }

  return false;
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
 * checkFieldIsRequired(userSchema, 'email'); // true
 * checkFieldIsRequired(userSchema, 'name');  // false
 * ```
 *
 * @param schema - The Zod object schema containing the field
 * @param field - The name of the field to check
 * @returns True if the field is required, false otherwise
 */
const checkFieldIsRequired = <TSchema extends ZodObject>(
  schema: TSchema,
  field: KeyAsString<ZodInfer<TSchema>>,
): boolean => {
  const fieldSchema = Reflect.get(schema.shape, field);

  return isFieldSchemaRequired(fieldSchema);
};

/**
 * Determines if a field is required based on its Zod schema validation in a discriminated union.
 * Checks if the field's schema rejects undefined values for a specific discriminator option.
 *
 * @example
 * ```tsx
 * const authSchema = z.discriminatedUnion('mode', [...]);
 * checkFieldIsRequiredInDiscriminatedUnion(authSchema, 'email', 'signin'); // true
 * ```
 *
 * @param schema - The discriminated union schema containing the field
 * @param field - The name of the field to check
 * @param discriminator - The discriminator value to match
 * @returns True if the field is required, false otherwise
 */
const checkFieldIsRequiredInDiscriminatedUnion = <
  TSchema extends ZodDiscriminatedUnion<Array<ZodObject>>,
>(
  schema: TSchema,
  field: KeyAsString<ZodInfer<TSchema>>,
  discriminator: ZodInfer<TSchema>["mode"],
): boolean => {
  const schemaFromDiscriminatedUnion = getSchemaFromDiscriminatedUnion(
    schema,
    discriminator,
  );

  if (!schemaFromDiscriminatedUnion) {
    return false;
  }

  const fieldSchema = Reflect.get(schemaFromDiscriminatedUnion.shape, field);

  return isFieldSchemaRequired(fieldSchema);
};

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
  errors: TFormErrors,
): boolean => {
  return getObjectKeys(errors).length > 0;
};

export const FormUtilsHelper = {
  checkFieldIsRequired,
  checkFieldIsRequiredInDiscriminatedUnion,
  getNoAutofillProps,
  getSchemaFromDiscriminatedUnion,
  hasFormErrors,
};
