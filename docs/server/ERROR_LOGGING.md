# Error Logging Configuration

## Overview

Structured error logging using **Pino** provides comprehensive error tracking, debugging capabilities, and operational visibility.

## Configuration

**Location**: `server/helpers/pino-log.helper.ts`

### Log Levels

| Level   | Value | Use Case                              |
| ------- | ----- | ------------------------------------- |
| `trace` | 10    | Very detailed debugging               |
| `debug` | 20    | Debugging information                 |
| `info`  | 30    | General informational messages        |
| `warn`  | 40    | Warning messages                      |
| `error` | 50    | Error messages                        |
| `fatal` | 60    | Fatal errors (application termination |

**Set via**: `LOG_LEVEL` environment variable

### Mode-Specific Behavior

| Mode               | Format                      | Transport   |
| ------------------ | --------------------------- | ----------- |
| **Development**    | Human-readable (`HH:MM:ss`) | pino-pretty |
| **Production**     | JSON (for log aggregation)  | None        |
| **Type Generator** | Human-readable              | pino-pretty |

## Usage

### Logger Instance

```typescript
import { PinoLogHelper } from "./helpers/pino-log.helper.ts";
const { log } = PinoLogHelper;
```

### Logging Patterns

#### Route Error Logging

```typescript
try {
  // Route logic
} catch (rawError) {
  const error = rawError instanceof Error ? rawError : new Error(`${rawError}`);

  log.error(
    {
      error: error.message,
      errorType: error.constructor.name,
      requestId,
      stack: error.stack,
      // Context
      email: request.body?.email,
      identityId: request.user?.identity_id,
    },
    "💥 Operation failed"
  );

  return reply.status(503).send({ error: "Operation failed" });
}
```

#### Middleware Error Logging

```typescript
log.error(
  {
    error: error.message,
    ip: request.ip,
    method: request.method,
    requestId,
    stack: error.stack,
    url: request.url,
  },
  "💥 Authentication middleware error"
);
```

#### Warning Logging

```typescript
log.warn(
  {
    ip: request.ip,
    method: request.method,
    requestId,
    url: request.url,
  },
  "Authentication failed: no token provided"
);
```

#### Info Logging

```typescript
log.info("✅ Server started successfully");
log.info({ requestId, userId }, "✅ Profile updated successfully");
```

### Global Error Handler

**Location**: `server/start.ts`

```typescript
app.setErrorHandler((error, request, reply) => {
  const requestId = request.id || "unknown";

  log.error(
    {
      error: error.message,
      method: request.method,
      requestId,
      stack: error.stack,
      statusCode: reply.statusCode || 500,
      url: request.url,
    },
    "💥 Unhandled error in request"
  );

  // Sanitize 5xx errors
  if (reply.statusCode >= 500 || !reply.statusCode) {
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
      statusCode: 500,
    });
  }

  // Pass through 4xx errors
  return reply.send(error);
});
```

**Benefits:**

- Catches all unhandled errors
- Logs with full context
- Sanitizes 5xx responses (security)
- Passes through 4xx responses (safe client errors)

## Error Response Structure

```typescript
{
  error: string;      // Human-readable error message
  details?: string;   // Optional additional context
  timestamp: string;  // ISO 8601 timestamp
  statusCode?: number;  // HTTP status code (optional)
}
```

## Best Practices

### Error Context

**Always include:**

- `error`: Error message
- `requestId`: Unique request identifier
- `stack`: Stack trace (when available)
- Contextual data (email, userId, url, etc.)

```typescript
// ✅ Good
log.error(
  {
    error: error.message,
    requestId,
    stack: error.stack,
    email: request.body?.email,
  },
  "💥 Signin failed"
);

// ❌ Bad
log.error("Error occurred");
```

### Error Normalization

```typescript
const error = rawError instanceof Error ? rawError : new Error(`${rawError}`);
```

### Request IDs

```typescript
import { IdUtilsHelper } from "../../shared/helpers/id-utils.helper.ts";
const { fastIdGen } = IdUtilsHelper;
const requestId = fastIdGen();
```

### Sensitive Data

**Never log:**

- ❌ Passwords
- ❌ Authentication tokens
- ❌ API keys
- ❌ Credit card numbers

**Safe to log:**

- ✅ Request IDs
- ✅ Email addresses (for context)
- ✅ User IDs
- ✅ Error messages

### Log Message Conventions

Use emoji prefixes for quick visual scanning:

- `💥` - Errors
- `✅` - Success
- `🚀` - Server/service start
- `🤖` - Configuration info
- `!` - Warnings

## Monitoring

### Development

Pretty-printed logs:

```
[10:30:00] ERROR: 💥 Signin failed
    email: "user@example.com"
    error: "Invalid password"
    requestId: "abc123"
    stack: "Error: Invalid password\n  at signin (...)"
```

### Production

Structured JSON logs:

```json
{
  "level": 50,
  "time": 1699873800000,
  "msg": "💥 Signin failed",
  "email": "user@example.com",
  "error": "Invalid password",
  "requestId": "abc123",
  "stack": "Error: Invalid password\n  at signin (...)"
}
```

### Log Analysis

```bash
# Find all authentication errors
grep "Authentication middleware error" logs.json

# Find errors for specific user
jq 'select(.email == "user@example.com")' logs.json

# Count errors by type
jq -r '.errorType' logs.json | sort | uniq -c

# Find all 500 errors
jq 'select(.statusCode >= 500)' logs.json

# Find all logs for a specific request
jq 'select(.requestId == "abc123")' logs.json
```

## Integration

### Log Aggregation Services

- **Datadog**: Datadog agent
- **Splunk**: Splunk forwarder
- **ELK Stack**: Filebeat
- **CloudWatch**: CloudWatch agent

### Alerting

Set up alerts for:

- Error rate exceeds threshold
- Specific error types occur
- 5xx response rate increases
- Failed authentication attempts spike

## Environment Variables

```bash
# Log level (trace, debug, info, warn, error, fatal)
LOG_LEVEL=info

# Mode
VITE_APP_IS_DEVELOPMENT=true
# Leave VITE_APP_TYPE_GENERATOR_MODE unset unless you are running `pnpm typegen:server`
# When generating server types set:
VITE_APP_TYPE_GENERATOR_MODE=type_generator
```

## Troubleshooting

### Logs Not Appearing

1. Check `LOG_LEVEL` is set correctly
2. Verify logger initialization
3. In development, ensure `pino-pretty` is installed
4. Check console output not suppressed

### Missing Stack Traces

1. Ensure errors are properly caught
2. Verify errors are Error instances (use normalization)
3. Check `stack` property included in log object

### Logs Too Verbose

1. Increase `LOG_LEVEL` to `warn` or `error`
2. Filter logs in production
3. Use structured logging queries

## Related Documentation

- [RATE_LIMITING.md](./RATE_LIMITING.md) - Rate limiting integration and logging
- [SECURITY.md](./SECURITY.md) - Security event logging
- [ROUTE_IMPLEMENTATION.md](./ROUTE_IMPLEMENTATION.md) - Route error handling patterns

## Resources

- [Pino Documentation](https://getpino.io/)
- [Pino Pretty](https://github.com/pinojs/pino-pretty)
- [Fastify Logging](https://fastify.dev/docs/latest/Reference/Logging/)
