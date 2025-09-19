import {
  zEmail,
  zEnum,
  zIsoDateTime,
  zObject,
  zString,
} from "../../wrappers/zod.wrapper.ts";

const signupRequestSchema = zObject({
  confirmPassword: zString().min(8),
  email: zEmail(),
  password: zString().min(8),
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
