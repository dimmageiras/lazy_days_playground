import { z } from "zod";
import type { $ZodConfig } from "zod/v4/core";
import type * as zodLocales from "zod/v4/locales";

type ZodConfig = $ZodConfig;
type ZodError<T = unknown> = z.ZodError<T>;
type ZodFormattedError = z.ZodFormattedError;
type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;
type ZodLocale = keyof typeof zodLocales;
type ZodObject<
  TShape extends z.core.$ZodShape = z.core.$ZodLooseShape,
  TConfig extends z.core.$ZodObjectConfig = z.core.$strip
> = z.ZodObject<TShape, TConfig>;
type ZodString = z.ZodString;

const zArray = z.array;
const zBoolean = z.boolean;
const zCoerce = z.coerce;
const zConfig = z.config;
const zDiscriminatedUnion = z.discriminatedUnion;
const zEmail = z.email;
const zEnum = z.enum;
const zIsoDateTime = z.iso.datetime;
const zLiteral = z.literal;
const zNumber = z.number;
const zObject = z.object;
const zRecord = z.record;
const zString = z.string;
const zToJSONSchema = z.toJSONSchema;
const zUnknown = z.unknown;

export type {
  ZodConfig,
  ZodError,
  ZodFormattedError,
  ZodInfer,
  ZodLocale,
  ZodObject,
  ZodString,
};
export {
  zArray,
  zBoolean,
  zCoerce,
  zConfig,
  zDiscriminatedUnion,
  zEmail,
  zEnum,
  zIsoDateTime,
  zLiteral,
  zNumber,
  zObject,
  zRecord,
  zString,
  zToJSONSchema,
  zUnknown,
};
