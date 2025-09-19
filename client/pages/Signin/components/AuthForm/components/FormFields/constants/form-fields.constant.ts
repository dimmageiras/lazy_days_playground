const FORM_FIELDS = Object.freeze({
  CONFIRM_PASSWORD: { label: "Confirm password", name: "confirmPassword" },
  EMAIL: { label: "Email address", name: "email" },
  PASSWORD: { label: "Password", name: "password" },
} as const);

export { FORM_FIELDS };
