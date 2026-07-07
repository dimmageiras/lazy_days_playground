import type { z } from "zod";
import {
  base64,
  enum as zodEnum,
  ipv4,
  iso,
  number,
  object,
  string,
  stringbool,
  url,
} from "zod";
import type { $ZodIssue } from "zod/v4/core";
import { config, toDotPath } from "zod/v4/core";

// Disable JIT compilation to avoid CSP violations with 'unsafe-eval'
config({ jitless: true });

type ZodInfer<T extends z.ZodTypeAny> = z.infer<T>;
type ZodInput<T extends z.ZodTypeAny> = z.input<T>;
type ZodIssue = $ZodIssue;

const zBase64 = base64;
const zEnum = zodEnum;
const zIpv4 = ipv4;
const zIsoDateTime = iso.datetime;
const zNumber = number;
const zObject = object;
const zString = string;
const zStringbool = stringbool;
const zToDotPath = toDotPath;
const zUrl = url;

export type { ZodInfer, ZodInput, ZodIssue };
export {
  zBase64,
  zEnum,
  zIpv4,
  zIsoDateTime,
  zNumber,
  zObject,
  zString,
  zStringbool,
  zToDotPath,
  zUrl,
};
