# Route Implementation Guide

## Overview

This guide covers implementing new routes in the Lazy Days Playground application. For detailed information on specific aspects, see the related documentation below.

## Quick Start

### File Structure

```
server/routes/<domain>/
├── index.ts                    # Domain router registration
└── <endpoint>/
    └── <endpoint>.route.ts     # Route implementation
```

### Implementation Steps

1. **Define constants**: `shared/constants/<domain>.constant.ts`
2. **Create schemas**: `shared/schemas/<domain>/<endpoint>-route.schema.ts`
3. **Implement route**: `server/routes/<domain>/<endpoint>/<endpoint>.route.ts`
4. **Register route**: `server/routes/<domain>/index.ts`
5. **Add to Swagger** (if new domain): `server/constants/swagger-routes.constant.ts`
6. **Generate types**: `pnpm run typegen:server`

## Route Template

```typescript
import type { FastifyInstance } from "fastify";
import type {
  FastifyZodOpenApiSchema,
  FastifyZodOpenApiTypeProvider,
} from "fastify-zod-openapi";
import type {
  MyEndpointCreateData,
  MyEndpointCreateError,
} from "@shared/types/generated/<domain>.type";

import { MY_ENDPOINTS } from "../../../../shared/constants/<domain>.constant.ts";
import {
  myEndpointRequestSchema,
  myEndpointSuccessSchema,
  myEndpointErrorSchema,
  myEndpointRateLimitErrorSchema,
} from "../../../../shared/schemas/<domain>/<endpoint>-route.schema.ts";
import { HTTP_STATUS } from "../../../constants/http-status.constant.ts";
import { MY_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";
import { RoutesHelper } from "../../../helpers/routes.helper.ts";

const myEndpointRoute = async (fastify: FastifyInstance): Promise<void> => {
  const { MY_ENDPOINT } = MY_ENDPOINTS;
  const { OK, BAD_REQUEST, MANY_REQUESTS_ERROR, SERVICE_UNAVAILABLE } =
    HTTP_STATUS;

  // Import only the helpers you need from RoutesHelper
  const { fastIdGen, getCurrentISOTimestamp, log } = RoutesHelper;

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
    `/${MY_ENDPOINT}`,
    {
      config: {
        rateLimit: MY_RATE_LIMIT,
      },
      schema: {
        description: "Detailed description of endpoint functionality",
        summary: "Short summary (2-5 words)",
        tags: ["Domain Name"],
        body: myEndpointRequestSchema,
        response: {
          [OK]: {
            content: {
              "application/json": { schema: myEndpointSuccessSchema },
            },
          },
          [BAD_REQUEST]: {
            content: { "application/json": { schema: myEndpointErrorSchema } },
          },
          [MANY_REQUESTS_ERROR]: {
            content: {
              "application/json": { schema: myEndpointRateLimitErrorSchema },
            },
          },
          [SERVICE_UNAVAILABLE]: {
            content: { "application/json": { schema: myEndpointErrorSchema } },
          },
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request, response) => {
      const requestId = fastIdGen();

      try {
        // Extract and validate input
        const { field } = request.body;

        // Business logic
        const result = await performOperation(field);

        // Success response
        const dbResponse: MyEndpointCreateData = {
          success: true,
          data: result,
          timestamp: getCurrentISOTimestamp(),
        };

        return response.status(OK).send(dbResponse);
      } catch (rawError) {
        // Normalize error
        const error =
          rawError instanceof Error ? rawError : new Error(`${rawError}`);

        // Log with context
        log.error(
          {
            error: error.message,
            requestId,
            stack: error.stack,
            field: request.body?.field,
          },
          "💥 My endpoint request failed with error"
        );

        // Error response
        const errorResponse: MyEndpointCreateError = {
          error: "Operation failed",
          details: error.message,
          timestamp: getCurrentISOTimestamp(),
        };

        return response.status(SERVICE_UNAVAILABLE).send(errorResponse);
      }
    }
  );
};

export { myEndpointRoute };
```

## Schema Definition

**Location**: `shared/schemas/<domain>/<endpoint>-route.schema.ts`

```typescript
import {
  zObject,
  zString,
  zBoolean,
  zIsoDateTime,
} from "../../wrappers/zod.wrapper.ts";
import { ZodSchemaHelper } from "../../../server/helpers/zod-schema.helper.ts";

const { createBaseRateLimitError } = ZodSchemaHelper;

// Request
const myRequestSchema = zObject({
  field: zString().min(1).meta({
    description: "Field description",
    example: "example value",
  }),
}).meta({ description: "Request body" });

// Success
const mySuccessSchema = zObject({
  success: zBoolean().meta({ description: "Success indicator", example: true }),
  timestamp: zIsoDateTime().meta({
    description: "Timestamp",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({ description: "Success response" });

// Error
const myErrorSchema = zObject({
  error: zString().meta({
    description: "Error message",
    example: "Operation failed",
  }),
  details: zString()
    .optional()
    .meta({ description: "Error details", example: "Details" }),
  timestamp: zIsoDateTime().meta({
    description: "Timestamp",
    example: "2024-01-01T00:00:00Z",
  }),
}).meta({ description: "Error response" });

// Rate limit error
const myRateLimitErrorSchema = createBaseRateLimitError({
  detailsDescription: "Rate limit details",
  detailsExample: "Rate limit exceeded",
});

export {
  myRequestSchema,
  mySuccessSchema,
  myErrorSchema,
  myRateLimitErrorSchema,
};
```

**See:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for schema patterns and best practices

## Route Configuration

### HTTP Methods

```typescript
fastify
  .withTypeProvider<FastifyZodOpenApiTypeProvider>()
  .get(/*...*/) // Retrieve data
  .post(/*...*/) // Create or perform action
  .put(/*...*/) // Update entire resource
  .patch(/*...*/) // Update partial resource
  .delete(/*...*/); // Remove resource
```

### Rate Limiting

Choose appropriate tier:

| Endpoint Type       | Rate Limit          | Use Case                      |
| ------------------- | ------------------- | ----------------------------- |
| **Authentication**  | `AUTH_RATE_LIMIT`   | Login, signup, password reset |
| **User Operations** | `USER_RATE_LIMIT`   | Email checks, profile updates |
| **Health Checks**   | `HEALTH_RATE_LIMIT` | Monitoring checks             |
| **General API**     | `GLOBAL_RATE_LIMIT` | Default for other endpoints   |

**See:** [RATE_LIMITING.md](./RATE_LIMITING.md) for rate limit details

### Protected Routes

```typescript
import { authMiddleware } from "../../../middleware/auth.middleware.ts";

fastify.get(
  "/protected",
  {
    preHandler: [authMiddleware], // Require authentication
    schema: {
      /* ... */
    },
  },
  handler
);
```

**See:** [SECURITY.md](./SECURITY.md) for authentication details

## Error Handling

### Pattern

```typescript
try {
  const result = await operation();
  return response.status(OK).send(result);
} catch (rawError) {
  const error = rawError instanceof Error ? rawError : new Error(`${rawError}`);

  log.error(
    {
      error: error.message,
      requestId,
      stack: error.stack,
      // Context fields
    },
    "💥 Operation failed with error"
  );

  return response.status(SERVICE_UNAVAILABLE).send({
    error: "Operation failed",
    details: error.message,
    timestamp: getCurrentISOTimestamp(),
  });
}
```

**See:** [ERROR_LOGGING.md](./ERROR_LOGGING.md) for logging patterns

## HTTP Status Codes

| Code | Constant              | Use Case                 |
| ---- | --------------------- | ------------------------ |
| 200  | `OK`                  | Success                  |
| 400  | `BAD_REQUEST`         | Validation error         |
| 401  | `UNAUTHORIZED`        | Authentication required  |
| 403  | `FORBIDDEN`           | Insufficient permissions |
| 404  | `NOT_FOUND`           | Resource not found       |
| 429  | `MANY_REQUESTS_ERROR` | Rate limit exceeded      |
| 503  | `SERVICE_UNAVAILABLE` | Operation failed         |

## Testing

### With curl

```bash
# Test successful request
curl -X POST http://localhost:5173/<domain>/<endpoint> \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}' \
  -i

# Test rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:5173/<domain>/<endpoint> \
    -H "Content-Type: application/json" \
    -d '{"field":"value"}' \
    -i
done
```

### With Swagger UI

1. Start server: `pnpm run dev`
2. Navigate to `http://localhost:5173/api/docs/swagger`
3. Find endpoint → "Try it out" → Fill parameters → "Execute"

## Custom Content Type Parsers

For non-standard content types (browser reports, webhooks), add a custom parser before route definition:

```typescript
fastify.addContentTypeParser(
  "application/csp-report",
  { parseAs: "string" },
  (request, body, done) => {
    try {
      done(null, JSON.parse(body as string));
    } catch (rawError) {
      const error =
        rawError instanceof Error ? rawError : new Error(String(rawError));
      log.error(
        { error: error.message, requestId: request.id },
        "💥 Parse failed"
      );
      done(error, undefined);
    }
  }
);
```

**Example**: `server/routes/api/reports/csp/create/create.route.ts`

## Best Practices

1. ✅ **Type Safety**: Use generated types for requests/responses
2. ✅ **Validation**: Let Fastify handle with Zod schemas
3. ✅ **Error Handling**: Always use try-catch with logging
4. ✅ **Request IDs**: Generate and log for tracking
5. ✅ **Rate Limiting**: Apply to sensitive endpoints
6. ✅ **Documentation**: Clear descriptions and examples
7. ✅ **Security**: Never log sensitive data
8. ✅ **Success Responses**: Do NOT log successful operations - only log errors and warnings
9. ✅ **Content Type Parsers**: Add custom parsers for non-standard content types

## Troubleshooting

### Routes Not Found (404)

1. Check route registration in domain index
2. Verify domain registered in `server/start.ts`
3. Check URL path matches prefix + endpoint name
4. Restart server

### Schema Validation Errors

1. Verify schema definition and exports
2. Check Zod types match expected data
3. Test with Swagger UI
4. Run `pnpm run typegen:server`

### Rate Limiting Issues

1. Verify `config.rateLimit` is set
2. Check rate limit constant import
3. Include `MANY_REQUESTS_ERROR` response schema
4. Test with curl

**See:** [RATE_LIMITING.md](./RATE_LIMITING.md)

### Logging Not Appearing

1. Check `LOG_LEVEL` environment variable
2. Verify `log` imported from `RoutesHelper`
3. Check log structure (object + message)

**See:** [ERROR_LOGGING.md](./ERROR_LOGGING.md)

## Summary Checklist

When implementing a new route:

- [ ] Define endpoint constants
- [ ] Create request/response/error schemas
- [ ] Include rate limit error schema
- [ ] Add custom content type parser (if needed)
- [ ] Implement route with type safety
- [ ] Apply appropriate rate limiting
- [ ] Add comprehensive error handling
- [ ] Include detailed logging with request IDs
- [ ] Add OpenAPI documentation
- [ ] Register route in domain index
- [ ] Add to Swagger routes (if new domain)
- [ ] Generate types (`pnpm run typegen:server`)
- [ ] Test with curl or Swagger UI
- [ ] Verify rate limiting works
- [ ] Check logs for errors

## Related Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Schemas, OpenAPI, type generation
- **[SECURITY.md](./SECURITY.md)** - Authentication, authorization, security
- **[RATE_LIMITING.md](./RATE_LIMITING.md)** - Rate limit configuration
- **[ERROR_LOGGING.md](./ERROR_LOGGING.md)** - Logging patterns and best practices
- **[SERVER_ARCHITECTURE.md](./SERVER_ARCHITECTURE.md)** - Architecture overview
