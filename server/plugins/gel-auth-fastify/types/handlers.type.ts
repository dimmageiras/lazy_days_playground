import type { Auth } from "@gel/auth-core";

interface EmailPasswordHandlers {
  signin: Auth["signinWithEmailPassword"];
  signup: Auth["signupWithEmailPassword"];
  verifyRegistration: Auth["verifyEmailPasswordSignup"];
}

export type { EmailPasswordHandlers };
