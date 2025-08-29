import { z } from "zod";

type ZodError = z.ZodError;
type ZodFormattedError = z.ZodFormattedError;
type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;
type ZodObject = z.ZodObject;
type ZodString = z.ZodString;

const zCoerce = z.coerce;
const zEmail = z.email;
const zEnum = z.enum;
const zObject = z.object;
const zString = z.string;

export type { ZodError, ZodFormattedError, ZodInfer, ZodObject, ZodString };
export { zCoerce, zEmail, zEnum, zObject, zString };
