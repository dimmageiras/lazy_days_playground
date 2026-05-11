const ISSUE_CODES = Object.freeze({
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
} as const);

export { ISSUE_CODES };
