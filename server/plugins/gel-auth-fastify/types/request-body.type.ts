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

export type { SigninRequestBody, SignupRequestBody, VerifyRequestBody };
