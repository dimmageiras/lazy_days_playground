import { z } from "zod";

type ZodError = z.ZodError;
type ZodFormattedError = z.ZodFormattedError;
type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;
type ZodObject = z.ZodObject;
type ZodString = z.ZodString;

const zBoolean = z.boolean;
const zCoerce = z.coerce;
const zEmail = z.email;
const zEnum = z.enum;
const zIsoDateTime = z.iso.datetime;
const zObject = z.object;
const zString = z.string;
const zToJSONSchema = z.toJSONSchema;
const zUnknown = z.unknown;

export type { ZodError, ZodFormattedError, ZodInfer, ZodObject, ZodString };
export {
  zBoolean,
  zCoerce,
  zEmail,
  zEnum,
  zIsoDateTime,
  zObject,
  zString,
  zToJSONSchema,
  zUnknown,
};
