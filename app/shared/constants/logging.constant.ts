const DEFAULT_LOG_REDACT_PATHS = Object.freeze([
  "req.headers.authorization",
  "req.headers.cookie",
  'req.headers["proxy-authorization"]',
  'res.headers["set-cookie"]',
] as const);

export { DEFAULT_LOG_REDACT_PATHS };
