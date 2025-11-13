# Server Architecture Documentation

## Overview

The server uses **Fastify** for HTTP handling, **React Router** for SSR, and **EdgeDB (GEL)** for data persistence. This document provides a high-level architectural overview.

## Technology Stack

| Component       | Technology    | Purpose                      |
| --------------- | ------------- | ---------------------------- |
| **HTTP Server** | Fastify 5.6.2 | High-performance HTTP server |
| **SSR**         | React Router  | Server-side rendering        |
| **Database**    | EdgeDB (GEL)  | Graph-relational database    |
| **Auth**        | GEL Auth Core | Authentication provider      |
| **Validation**  | Zod           | Runtime schema validation    |
| **Logging**     | Pino          | Structured logging           |
| **Security**    | Helmet        | HTTP security headers        |

**See also:** [SECURITY.md](./SECURITY.md), [RATE_LIMITING.md](./RATE_LIMITING.md), [API_DOCUMENTATION.md](./API_DOCUMENTATION.md), [ERROR_LOGGING.md](./ERROR_LOGGING.md)

## Request Flow

```
Client → Fastify
  → Security (Helmet + Rate Limit)
  → Auth Middleware (if protected)
  → Validation (Zod)
  → Route Handler → Database
  → Response / Error Handler
  → Client
```

## Entry Points

**`server/index.ts`**: Environment validation → imports `server/start.ts`

**`server/start.ts`**: Main initialization

1. Create Fastify instance
2. Initialize GEL database client
3. Register plugins (security, validation, routes, SSR)
4. Set global error handler
5. Start HTTP server

## Core Components

### 1. Fastify Instance

```typescript
const app = fastify({
  disableRequestLogging: IS_DEVELOPMENT,
  loggerInstance: log,
  requestTimeout: SECONDS_TEN_IN_MS,
});
```

### 2. GEL Database Client

```typescript
const gelClient = createClient({ dsn: GEL_AUTH_BASE_URL });
await gelClient.ensureConnected(); // Connection pooling
app.decorate("gelClient", gelClient); // Available in all routes
```

**Note**: The main server uses `GEL_AUTH_BASE_URL` for the shared connection pool. Some routes may create separate connections using `GEL_DSN` for specific operations.

### 3. Plugin System

Plugins registered in order:

1. `fastifyZodOpenApiPlugin` - Zod validation
2. `helmet` - Security headers
3. `cookieFastify` - Cookie management
4. `rateLimitFastify` - Rate limiting
5. `swaggerFastify` / `swaggerUIFastify` (dev/type-gen only)
6. Route plugins (API Health, Auth, User)
7. `reactRouterFastify` - SSR (last, catches all)

### 4. Global Error Handler

```typescript
app.setErrorHandler((error, request, reply) => {
  // Log with full context
  log.error({ error, requestId, statusCode, url, stack });

  // Sanitize 5xx errors (hide internal details)
  if (reply.statusCode >= 500) {
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred.",
    });
  }

  // Pass through 4xx errors (safe client errors)
  return reply.send(error);
});
```

## Folder Structure

```
server/
├── index.ts                 # Entry point (env validation)
├── start.ts                 # Server initialization
├── constants/               # Server constants (rate limits, CSP, etc.)
├── helpers/                 # Utilities (auth, encryption, logging, etc.)
├── middleware/              # Request middleware (auth)
├── plugins/                 # Custom Fastify plugins
├── routes/                  # API routes by domain
│   ├── <domain>/
│   │   ├── index.ts        # Domain router
│   │   └── <endpoint>/     # Endpoint implementation
└── types/                   # Server-specific types
```

**See:** [ROUTE_IMPLEMENTATION.md](./ROUTE_IMPLEMENTATION.md) for route structure details

## Configuration

### Environment Variables

**Location**: `shared/constants/root-env.constant.ts`

**Critical variables:**

- `COOKIE_SECRET` - Cookie signing/encryption
- `GEL_AUTH_BASE_URL` - Database connection for main server pool
- `GEL_DSN` - Database connection for route-specific queries
- `VITE_APP_IS_DEVELOPMENT` - Development mode flag

**Note**: Both `GEL_AUTH_BASE_URL` and `GEL_DSN` are typically set to the same database DSN value.

### Development vs Production

| Feature           | Development                    | Production                  |
| ----------------- | ------------------------------ | --------------------------- |
| **Rate Limits**   | 10-200x higher                 | Strict (5-100 req/window)   |
| **HTTPS**         | Not required                   | Required (`secure` flag)    |
| **CSP**           | Disabled (DevTools compatible) | Fully enforced              |
| **Swagger UI**    | Enabled at `/api/docs/swagger` | Disabled (security)         |
| **Logging**       | Pretty-printed (pino-pretty)   | JSON (for aggregation)      |
| **Error Details** | Verbose                        | Sanitized (no stack traces) |

## Database Integration

### Connection Pool

```typescript
// Startup
await gelClient.ensureConnected();

// Shutdown
process.on("SIGTERM", async () => {
  await gelClient.close();
});
```

### Query Pattern

```typescript
// Always use parameterized queries
await fastify.gelClient.query(
  `
  SELECT User { id, email }
  FILTER .email = <str>$email
`,
  { email }
);
```

**See:** [GEL_DATABASE_GUIDE.md](../GEL_DATABASE_GUIDE.md)

## Authentication Flow

1. **Extract cookie**: Signed + encrypted
2. **Decrypt token**: AES-256-GCM
3. **Validate JWT**: Check expiration + structure
4. **Attach user**: `request.user = { identity_id, expiresAt }`

**Implementation**: `server/middleware/auth.middleware.ts`

**See:** [SECURITY.md](./SECURITY.md) for authentication details

## Type Safety

### Generated Types

```
Zod Schemas → OpenAPI Spec → TypeScript Types
```

**Command**: `pnpm run typegen:server`

**Output**: `shared/types/generated/<domain>.type.ts`

**See:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Key Patterns

### Error Handling

```typescript
try {
  const result = await operation();
  return reply.status(200).send(result);
} catch (rawError) {
  const error = rawError instanceof Error ? rawError : new Error(`${rawError}`);
  log.error({ error, requestId, stack: error.stack });
  return reply.status(503).send({ error: "Operation failed" });
}
```

### Route Implementation

```typescript
fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
  "/endpoint",
  {
    config: { rateLimit: MY_RATE_LIMIT },
    schema: {
      body: requestSchema,
      response: { 200: successSchema, 400: errorSchema },
    },
  },
  handler
);
```

## Scalability

### Current Architecture

- Single server with connection pooling
- In-memory rate limiting (per-IP)
- Stateless authentication (JWT in cookies)

### Future Improvements

- **Horizontal scaling**: Redis for rate limit state
- **Load balancing**: Multiple server instances
- **Caching**: Redis/CDN for frequent queries
- **Monitoring**: Prometheus + Grafana

## Best Practices

1. ✅ **Validation**: Always use Zod schemas
2. ✅ **Error Handling**: Try-catch with logging + sanitization
3. ✅ **Rate Limiting**: Apply to sensitive endpoints
4. ✅ **Type Safety**: Use generated types
5. ✅ **Security**: See [SECURITY.md](./SECURITY.md)
6. ✅ **Logging**: Structured logs with request IDs
7. ✅ **Database**: Parameterized queries only

## Related Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - OpenAPI/Swagger, type generation
- **[SECURITY.md](./SECURITY.md)** - Security implementation, authentication
- **[RATE_LIMITING.md](./RATE_LIMITING.md)** - Rate limit configuration
- **[ERROR_LOGGING.md](./ERROR_LOGGING.md)** - Logging patterns
- **[ROUTE_IMPLEMENTATION.md](./ROUTE_IMPLEMENTATION.md)** - Route implementation guide
