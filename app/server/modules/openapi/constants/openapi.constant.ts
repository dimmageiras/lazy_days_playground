import type { oas32 } from "zod-openapi";

const OPENAPI_OPTIONS = Object.freeze({
  info: {
    description: "HTTP API for the Lazy Days Playground server.",
    title: "Lazy Days Playground API",
    version: "1.0.0",
  },
  openapi: "3.2.0",
} as const satisfies Partial<oas32.OpenAPIObject>);

export { OPENAPI_OPTIONS };
