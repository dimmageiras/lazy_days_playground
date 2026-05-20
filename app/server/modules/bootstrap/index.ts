import { bootstrapServer } from "./bootstrap.module";
import { HEADERS } from "./constants/headers.constant";
import type { CloseWithGraceReturn } from "./types";

// Pino redact-paths covering every header this module reads or sets so the
// composition layer doesn't have to know which header names are bootstrap-
// internal — adding a new sensitive header here keeps redaction in sync.
const bootstrapRedactPaths: readonly string[] = Object.freeze([
  `req.headers["${HEADERS.SHUTDOWN_TOKEN_HEADER}"]`,
] as const);

export type { CloseWithGraceReturn };
export { bootstrapRedactPaths, bootstrapServer };
