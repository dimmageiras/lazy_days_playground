import { z } from "zod";

const zCoerce = z.coerce;
const zEmail = z.email;
const zEnum = z.enum;
const zObject = z.object;
const zString = z.string;

type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;

export type { ZodInfer };
export { zCoerce, zEmail, zEnum, zObject, zString };
