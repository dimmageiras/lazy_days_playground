import {
  zEmail,
  zEnum,
  zIsoDateTime,
  zObject,
  zString,
} from "../../wrappers/zod.wrapper.ts";

const passwordSchema = zString()
  .min(8, "Password must be at least 8 characters")
  .max(50, "Password must be less than 50 characters")
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => /[a-z]/.test(password), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "Password must contain at least one number",
  });

const signupRequestSchema = zObject({
  confirmPassword: zString().min(1, "Please confirm your password"),
  email: zEmail(),
  password: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const tokenDataSchema = zObject({
  auth_token: zString(),
  identity_id: zString(),
  provider_id_token: zString().nullable(),
  provider_refresh_token: zString().nullable(),
  provider_token: zString().nullable(),
});

const signupResponseSchema = zObject({
  error: zString().optional(),
  identity_id: zString().nullable().optional(),
  status: zEnum(["complete", "verificationRequired"]).optional(),
  timestamp: zIsoDateTime(),
  tokenData: tokenDataSchema.optional(),
  verifier: zString().optional(),
});

export { signupRequestSchema, signupResponseSchema };
