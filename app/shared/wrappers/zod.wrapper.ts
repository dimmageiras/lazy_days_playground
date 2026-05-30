import { z } from "zod";
import type { $ZodIssue } from "zod/v4/core";
import { toDotPath } from "zod/v4/core";

// Disable JIT compilation to avoid CSP violations with 'unsafe-eval'
z.config({ jitless: true });

type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;
type ZodInput<T extends z.ZodTypeAny> = z.input<T>;
type ZodIssue = $ZodIssue;

const zNumber = z.number;
const zObject = z.object;
const zString = z.string;
const zToDotPath = toDotPath;

export type { ZodInfer, ZodInput, ZodIssue };
export { zNumber, zObject, zString, zToDotPath };
