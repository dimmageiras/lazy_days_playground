import { zodResolver } from "@hookform/resolvers/zod";
import type { KeyAsString } from "type-fest";
import type { ZodDiscriminatedUnion } from "zod";
import { z } from "zod";
import type { $ZodConfig } from "zod/v4/core";
import type * as zodLocales from "zod/v4/locales";

// Disable JIT compilation to avoid CSP violations with 'unsafe-eval'
z.config({ jitless: true });

type ZodConfig = $ZodConfig;
type ZodError<T = unknown> = z.ZodError<T>;
type ZodFormattedError = z.ZodFormattedError;
type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;
type ZodLocale = KeyAsString<typeof zodLocales>;
type ZodObject<
  TShape extends z.core.$ZodShape = z.core.$ZodLooseShape,
  TConfig extends z.core.$ZodObjectConfig = z.core.$strip
> = z.ZodObject<TShape, TConfig>;

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
const zResolver = zodResolver;
const zString = z.string;
const zUnknown = z.unknown;

export type {
  ZodConfig,
  ZodDiscriminatedUnion,
  ZodError,
  ZodFormattedError,
  ZodInfer,
  ZodLocale,
  ZodObject,
};
export {
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
  zResolver,
  zString,
  zUnknown,
};
