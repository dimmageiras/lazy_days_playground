import {
  zBoolean,
  zEmail,
  zIsoDateTime,
  zObject,
  zString,
} from "../../wrappers/zod.wrapper.ts";

const checkEmailRequestSchema = zObject({
  email: zEmail(),
});

const checkEmailResponseSchema = zObject({
  details: zString().optional(),
  email: zEmail(),
  error: zString().optional(),
  exists: zBoolean(),
  timestamp: zIsoDateTime(),
});

export { checkEmailRequestSchema, checkEmailResponseSchema };
