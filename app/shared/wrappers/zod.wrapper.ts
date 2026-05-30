import { z } from "zod";

// Disable JIT compilation to avoid CSP violations with 'unsafe-eval'
z.config({ jitless: true });

type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;
type ZodInput<T extends z.ZodTypeAny> = z.input<T>;

const zNumber = z.number;
const zObject = z.object;
const zString = z.string;

export type { ZodInfer, ZodInput };
export { zNumber, zObject, zString };
