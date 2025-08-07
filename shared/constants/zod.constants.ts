import { zEnum } from "../../shared/wrappers/zod.wrapper.ts";

const LOG_LEVELS = zEnum([
  "debug",
  "error",
  "fatal",
  "info",
  "silent",
  "trace",
  "warn",
]);

const ISSUE_CODES = {
  CUSTOM: "custom",
  INVALID_ELEMENT: "invalid_element",
  INVALID_FORMAT: "invalid_format",
  INVALID_KEY: "invalid_key",
  INVALID_TYPE: "invalid_type",
  INVALID_UNION: "invalid_union",
  INVALID_VALUE: "invalid_value",
  NOT_MULTIPLE_OF: "not_multiple_of",
  TOO_BIG: "too_big",
  TOO_SMALL: "too_small",
  UNRECOGNIZED_KEYS: "unrecognized_keys",
} as const;

export { LOG_LEVELS, ISSUE_CODES };
