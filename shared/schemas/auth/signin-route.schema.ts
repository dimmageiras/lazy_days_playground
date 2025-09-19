import {
  zEmail,
  zIsoDateTime,
  zObject,
  zString,
} from "../../wrappers/zod.wrapper.ts";

const signinRequestSchema = zObject({
  email: zEmail(),
  password: zString(),
});

const signinResponseSchema = zObject({
  auth_token: zString().optional(),
  details: zString().optional(),
  error: zString().optional(),
  identity_id: zString().nullable().optional(),
  provider_id_token: zString().nullable().optional(),
  provider_refresh_token: zString().nullable().optional(),
  provider_token: zString().nullable().optional(),
  timestamp: zIsoDateTime(),
});

export { signinRequestSchema, signinResponseSchema };
