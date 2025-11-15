# API Documentation Guide

## Overview

The application uses **Zod schemas** as the single source of truth for API contracts, automatically generating **OpenAPI specifications** and **TypeScript types**.

## Architecture

```
Zod Schemas (shared/schemas/)
  ↓
Runtime Validation (Fastify)
  ↓
OpenAPI Spec (Swagger)
  ↓
TypeScript Types (swagger-typescript-api)
```

**Benefits:**

- Single source of truth
- Compile-time + runtime validation
- Self-documenting APIs
- Type-safe client/server communication

## Technology Stack

| Package                  | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `fastify-zod-openapi`    | Connects Zod schemas to OpenAPI spec    |
| `zod`                    | Schema definition and validation        |
| `@fastify/swagger`       | OpenAPI spec generation                 |
| `@fastify/swagger-ui`    | Interactive API documentation UI        |
| `swagger-typescript-api` | Generates TypeScript types from OpenAPI |

## OpenAPI/Swagger Setup

**Location**: `server/start.ts`

```typescript
// Set up Zod validators
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(fastifyZodOpenApiPlugin);

// OpenAPI spec (dev/type-gen only)
await fastify.register(swaggerFastify, {
  openapi: {
    info: {
      title: "Lazy Days Playground API",
      version: "1.0.0",
      description: "API documentation for Lazy Days Playground application",
      contact: { name: "API Support" },
      license: { name: "MIT" },
    },
    openapi: "3.1.0",
  },
  ...fastifyZodOpenApiTransformers,
});

// Swagger UI (dev only) - includes security hooks and CSP configuration
await fastify.register(swaggerUIFastify, {
  routePrefix: `/${API_DOCS_BASE_URL}/${SWAGGER}`, // Resolves to "/api/docs/swagger"
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
  staticCSP: true,
  // Additional configuration for security and server detection in actual implementation
});
```

**Note**: The actual implementation in `server/start.ts` includes additional configuration for UI hooks (request validation), CSP transformation, and dynamic server URL detection based on headers.

**Modes:**

- **Development**: Swagger UI enabled at `/api/docs/swagger`
- **Production**: Disabled (security)
- **Type Generator**: Spec generated, no UI

## Schema Definition

### Basic Schema Pattern

**Location**: `shared/schemas/<domain>/<endpoint>-route.schema.ts`

```typescript
import {
  zObject,
  zString,
  zEmail,
  zIsoDateTime,
} from "../../wrappers/zod.wrapper.ts";
import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

// Request schema
const myRequestSchema = zObject({
  email: zEmail().meta({
    description: "User's email address",
    example: "user@example.com",
  }),
  password: zString().min(8).meta({
    description: "User's password (8+ characters)",
    example: "SecurePass123",
  }),
}).meta({
  description: "Request body for my endpoint",
});

// Success response
const mySuccessSchema = zObject({
  success: zBoolean().meta({
    description: "Operation success indicator",
    example: true,
  }),
  timestamp: zIsoDateTime().meta({
    description: "ISO timestamp",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Success response",
});

// Error response
const myErrorSchema = zObject({
  error: zString().meta({
    description: "Error message",
    example: "Operation failed",
  }),
  details: zString().optional().meta({
    description: "Additional error details",
    example: "Invalid input",
  }),
  timestamp: zIsoDateTime().meta({
    description: "Error timestamp",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({
  description: "Error response",
});

// Rate limit error
const myRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription: "Rate limit error details",
  detailsExample: "Rate limit exceeded",
});
```

### Schema Best Practices

1. **Always use `.meta()`** for descriptions and examples
2. **Provide realistic examples**
3. **Use clear validation messages**
4. **Document optional fields**
5. **Use consistent error structure**

## Route Documentation

```typescript
fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
  "/endpoint",
  {
    schema: {
      description: "Detailed description of endpoint functionality",
      summary: "Short summary (2-5 words)",
      tags: ["Domain Name"],
      body: requestSchema,
      response: {
        200: { content: { "application/json": { schema: successSchema } } },
        400: { content: { "application/json": { schema: errorSchema } } },
        429: {
          content: { "application/json": { schema: rateLimitErrorSchema } },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
  },
  handler
);
```

**Key fields:**

- `description`: Comprehensive endpoint documentation
- `summary`: Brief, action-oriented summary
- `tags`: Grouping in Swagger UI
- `body`/`querystring`/`params`: Request schemas
- `response`: All possible response schemas by status code

## Type Generation

### Workflow

**Command**: `pnpm run typegen:server`

**Process:**

1. Start server in `TYPE_GENERATOR` mode
2. Register all routes
3. Generate OpenAPI spec from Zod schemas
4. Extract routes by domain (auth, user, api-health)
5. Generate TypeScript types per domain
6. Clean and format generated files
7. Run ESLint fixes
8. Exit

**Output**: `shared/types/generated/server/<domain>.type.ts`

### Generated Type Naming

```typescript
// For: POST /auth/signin
SigninCreatePayload; // Request body
SigninCreateData; // Success response (200)
SigninCreateError; // Error responses (400, 401, 429, 503)

// For: GET /user/profile
ProfileListData; // Success response
ProfileListError; // Error responses
```

**Pattern**: `<Endpoint><Method><Type>`

- **Method mapping**: POST→Create, GET→List, PUT/PATCH→Update, DELETE→Delete
- **Types**: Payload (request), Data (success), Error (errors)

### Using Generated Types

```typescript
import type {
  SigninCreateData,
  SigninCreateError,
} from "@shared/types/generated/auth.type";

async (request, reply) => {
  const response: SigninCreateData = {
    identity_id: userId,
    timestamp: getCurrentISOTimestamp(),
  };

  return reply.status(200).send(response);
};
```

## Adding New Routes

1. **Define constants**: `shared/constants/<domain>.constant.ts`
2. **Create schemas**: `shared/schemas/<domain>/<endpoint>-route.schema.ts`
3. **Implement route**: `server/routes/<domain>/<endpoint>/<endpoint>.route.ts`
4. **Register route**: `server/routes/<domain>/index.ts`
5. **Add to Swagger routes** (if new domain): `server/constants/swagger-routes.constant.ts`
6. **Generate types**: `pnpm run typegen:server`

## Accessing Documentation

### Development

**Start server**: `pnpm run dev`

**Swagger UI**: `http://localhost:5173/api/docs/swagger`

**OpenAPI Spec**:

- JSON: `http://localhost:5173/api/docs/swagger/json`
- YAML: `http://localhost:5173/api/docs/swagger/yaml`

### Production

- Swagger UI **disabled** (security)
- Types generated at build time
- Use development/staging spec for client generation

## Common Schema Patterns

```typescript
// Email
email: zEmail().meta({ description: "...", example: "user@example.com" });

// Password
password: zString()
  .min(8)
  .max(128)
  .meta({ description: "...", example: "..." });

// UUID (using string validation)
id: zString().uuid().meta({ description: "...", example: "123e4567-..." });

// Timestamp
timestamp: zIsoDateTime().meta({
  description: "...",
  example: "2024-01-01T00:00:00Z",
});

// Boolean
isActive: zBoolean().meta({ description: "...", example: true });

// Enum
status: zEnum(["pending", "active"]).meta({
  description: "...",
  example: "active",
});

// Optional
bio: zString().max(500).optional().meta({ description: "...", example: "..." });
```

## Troubleshooting

### Types Not Generated

1. Check route registration in domain index
2. Verify domain in `server/start.ts`
3. Ensure schema exported and used in route
4. Check `SWAGGER_ROUTES` constant
5. Run `pnpm run typegen:server` with `LOG_LEVEL=debug`

### Validation Errors

1. Check Zod schema definition
2. Verify custom error messages
3. Test with Swagger UI
4. Check generated types match schema

### OpenAPI Spec Errors

1. Validate spec: `npx @apidevtools/swagger-cli validate http://localhost:5173/api/docs/swagger/json`
2. Check for circular references
3. Verify all schemas have required properties

## Special Routes

### CSP Violation Reporting

**Route**: `POST /api/reports/csp-report`

Receives CSP violation reports automatically sent by browsers. Uses custom `application/csp-report` content type parser, stores reports in `default::CspReport`, and applies `HEALTH_RATE_LIMIT`.

**Implementation**: `server/routes/api/reports/csp/create/create.route.ts`  
**Schemas**: `shared/schemas/api-health/csp-report-route.schema.ts`  
**See**: [SECURITY.md](./SECURITY.md) for configuration

## Related Documentation

- [ROUTE_IMPLEMENTATION.md](./ROUTE_IMPLEMENTATION.md) - Route implementation guide
- [SECURITY.md](./SECURITY.md) - Security considerations (includes CSP reporting)
- [RATE_LIMITING.md](./RATE_LIMITING.md) - Rate limiting documentation
- [ERROR_LOGGING.md](./ERROR_LOGGING.md) - Error logging patterns

## Resources

- [fastify-zod-openapi](https://github.com/samchungy/fastify-zod-openapi)
- [Zod Documentation](https://zod.dev/)
- [OpenAPI 3.1.0 Specification](https://spec.openapis.org/oas/v3.1.0)
- [swagger-typescript-api](https://github.com/acacode/swagger-typescript-api)
