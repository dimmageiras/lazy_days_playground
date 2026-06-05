import { z } from "zod";
import type { $ZodIssue } from "zod/v4/core";
import { toDotPath } from "zod/v4/core";

// Disable JIT compilation to avoid CSP violations with 'unsafe-eval'
z.config({ jitless: true });

type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;
type ZodInput<T extends z.ZodTypeAny> = z.input<T>;
type ZodIssue = $ZodIssue;

const zEnum = z.enum;
const zIpv4 = z.ipv4;
const zIpv6 = z.ipv6;
const zNumber = z.number;
const zObject = z.object;
const zString = z.string;
const zStringbool = z.stringbool;
const zToDotPath = toDotPath;

export type { ZodInfer, ZodInput, ZodIssue };
export {
  zEnum,
  zIpv4,
  zIpv6,
  zNumber,
  zObject,
  zString,
  zStringbool,
  zToDotPath,
};
