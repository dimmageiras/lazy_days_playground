import {
  zIsoDateTime,
  zObject,
  zString,
} from "../../../../shared/wrappers/zod.wrapper.ts";

const verifyRequestSchema = zObject({
  verificationToken: zString(),
  verifier: zString(),
});

const verifyResponseSchema = zObject({
  auth_token: zString().optional(),
  details: zString().optional(),
  error: zString().optional(),
  identity_id: zString().nullable().optional(),
  provider_id_token: zString().nullable().optional(),
  provider_refresh_token: zString().nullable().optional(),
  provider_token: zString().nullable().optional(),
  timestamp: zIsoDateTime(),
});

export { verifyRequestSchema, verifyResponseSchema };
