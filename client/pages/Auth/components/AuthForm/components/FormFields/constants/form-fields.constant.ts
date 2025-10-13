const FORM_FIELDS = Object.freeze({
  CONFIRM_PASSWORD: { label: "Confirm password", name: "confirmPassword" },
  EMAIL: { label: "Email address", name: "email" },
  PASSWORD: { label: "Password", name: "password" },
} as const);

const FORM_TYPES = Object.freeze({
  SIGNIN: "signin",
  SIGNUP: "signup",
} as const);

export { FORM_FIELDS, FORM_TYPES };
