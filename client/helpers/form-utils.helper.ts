import type { ZodString } from "zod";

import type { ZodInfer, ZodObject } from "@shared/wrappers/zod.wrapper";

const getNoAutofillProps = (): Record<PropertyKey, unknown> => ({
  "aria-autocomplete": "off",
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

const isFieldRequired = <TSchema extends ZodObject>(
  schema: TSchema,
  field: keyof ZodInfer<TSchema>
): boolean => {
  const fieldSchema: ZodString = Reflect.get(schema.shape, field);

  return !fieldSchema.safeParse(undefined).success;
};

export const FormUtilsHelper = {
  getNoAutofillProps,
  isFieldRequired,
};
