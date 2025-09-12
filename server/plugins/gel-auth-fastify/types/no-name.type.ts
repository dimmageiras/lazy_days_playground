import type { Auth } from "@gel/auth-core";

interface EmailPasswordHandlers {
  signin: Auth["signinWithEmailPassword"];
  signup: Auth["signupWithEmailPassword"];
  verifyRegistration: Auth["verifyEmailPasswordSignup"];
}

interface FastifyAuthOptions {
  authCookieName?: string;
  baseUrl: string;
  pkceVerifierCookieName?: string;
}

interface EmailPasswordInput {
  email: string;
  password: string;
}

interface SigninRequestBody {
  Body: EmailPasswordInput;
}

interface SignupRequestBody {
  Body: EmailPasswordInput & { confirmPassword: string };
}

interface VerificationToken {
  verificationToken: string;
  verifier: string;
}

interface VerifyRequestBody {
  Body: VerificationToken;
}

export type {
  EmailPasswordHandlers,
  FastifyAuthOptions,
  SigninRequestBody,
  SignupRequestBody,
  VerifyRequestBody,
};
