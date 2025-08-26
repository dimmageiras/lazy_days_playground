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

export const FormUtilsHelper = {
  getNoAutofillProps,
};
