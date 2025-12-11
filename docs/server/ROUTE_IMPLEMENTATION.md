# Route Implementation Guide

## Overview

This guide covers implementing new routes with consistent patterns for error handling, validation, authentication, and documentation.

## Quick Start

### File Structure

```
server/routes/<domain>/
├── index.ts                    # Domain router registration
└── <endpoint>/
    ├── <endpoint>.route.ts     # Route implementation
    ├── index.ts                # Route registration (optional)
    └── constants/              # Endpoint-specific constants (optional)
        └── <query>.constant.ts
```

### Implementation Steps

1. **Define constants**: `shared/constants/<domain>.constant.ts`
2. **Create schemas**: `shared/schemas/<domain>/<endpoint>-route.schema.ts`
3. **Implement route**: `server/routes/<domain>/<endpoint>/<endpoint>.route.ts`
4. **Register route**: `server/routes/<domain>/index.ts`
5. **Add to Swagger** (if new domain): `server/constants/swagger-routes.constant.ts`
6. **Generate types**: `pnpm run typegen:server`

## Common Patterns

### CRUD Operations

- **Create**: `POST /<domain>/<resource>` with request body
- **Read**: `GET /<domain>/<resource>/<id>` or `GET /<domain>/<resource>` for lists
- **Update**: `PUT /<domain>/<resource>/<id>` for full update, `PATCH /<domain>/<resource>/<id>` for partial
- **Delete**: `DELETE /<domain>/<resource>/<id>`

### Response Patterns

- **Success**: Include `success: true` and `timestamp` fields
- **Errors**: Include `error`, `details` (optional), and `timestamp` fields
- **Rate Limits**: Use standardized error format with retry information

### Authentication Levels

- **Public**: No middleware (health checks, CSP reports)
- **Optional**: `optionalAuthMiddleware` (enhanced features for authenticated users)
- **Required**: `authMiddleware` (user-specific operations)

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

## Generic Examples

### Simple GET Endpoint

```typescript
fastify.get(
  `/${ENDPOINT}`,
  {
    schema: {
      summary: "Get resource",
      tags: ["Domain"],
      response: {
        [OK]: { content: { "application/json": { schema: successSchema } } },
      },
    },
  },
  async (request, response) => {
    const requestId = fastIdGen();
    const result = await getResource();
    return response.status(OK).send({
      success: true,
      data: result,
      timestamp: getCurrentISOTimestamp(),
    });
  }
);
```

### Authenticated POST Endpoint

```typescript
fastify.post(
  `/${ENDPOINT}`,
  {
    preHandler: [authMiddleware],
    config: { rateLimit: USER_RATE_LIMIT },
    schema: {
      /* ... */
    },
  },
  async (request, response) => {
    const requestId = fastIdGen();
    const { user } = request;
    const result = await createResource(request.body, user.identity_id);
    return response.status(OK).send({
      success: true,
      data: result,
      timestamp: getCurrentISOTimestamp(),
    });
  }
);
```

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

### Common Issues

**Routes Not Found (404)**

- Verify route registration in domain index
- Check domain registered in server start file
- Confirm URL path matches prefix + endpoint
- Restart development server

**Schema Validation Errors**

- Ensure schema exports match imports
- Verify Zod types align with request/response data
- Test with Swagger UI for validation details
- Regenerate types: `pnpm run typegen:server`

**Rate Limiting Problems**

- Confirm `config.rateLimit` is configured
- Verify rate limit constant is imported
- Include rate limit error schema in responses
- Test limits with repeated requests

**Authentication Failures**

- Check middleware import and configuration
- Verify token format and validity
- Ensure protected routes use correct middleware

**Logging Issues**

- Verify `LOG_LEVEL` environment setting
- Confirm `log` import from RoutesHelper
- Check log object structure (context + message)

**Type Errors**

- Run `pnpm run typegen:server` after schema changes
- Verify generated types match expectations
- Check import paths for type definitions

## Implementation Checklist

- [ ] Define endpoint constants in domain constants file
- [ ] Create Zod schemas (request, success, error, rate limit)
- [ ] Implement route handler with error handling and logging
- [ ] Configure rate limiting and authentication as needed
- [ ] Add OpenAPI schema documentation
- [ ] Register route in domain index
- [ ] Update Swagger routes for new domains
- [ ] Generate types: `pnpm run typegen:server`
- [ ] Test endpoint functionality and error cases

## Related Documentation

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Schema patterns and OpenAPI
- [RATE_LIMITING.md](./RATE_LIMITING.md) - Rate limiting configuration
- [ERROR_LOGGING.md](./ERROR_LOGGING.md) - Logging best practices
