const AUTH_ENDPOINTS = Object.freeze({
  LOGOUT: "logout",
  ME: "me",
  RESEND_VERIFICATION_EMAIL: "resend-verification-email",
  RESET_PASSWORD: "reset-password",
  SEND_PASSWORD_RESET_EMAIL: "send-password-reset-email",
  SIGNIN: "signin",
  SIGNUP: "signup",
  VERIFY: "verify",
} as const);

export { AUTH_ENDPOINTS };
