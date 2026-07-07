import type { OpenAPIV3_1 } from "openapi-types";

const OPENAPI_OPTIONS = Object.freeze({
  info: {
    description: "HTTP API for the Lazy Days Playground server.",
    license: {
      name: "MIT",
    },
    title: "Lazy Days Playground API",
    version: "1.0.0",
  },
  openapi: "3.1.2",
} as const satisfies Partial<OpenAPIV3_1.Document>);

export { OPENAPI_OPTIONS };
