# Rate Limiting Configuration

## Overview

Rate limiting protects against abuse, brute force attacks, and ensures fair resource allocation.

## Rate Limit Tiers

**Location**: `server/constants/rate-limit.constant.ts`

| Tier               | Development      | Production     | Time Window | Applied To                                |
| ------------------ | ---------------- | -------------- | ----------- | ----------------------------------------- |
| **Global**         | 1,000 req        | 100 req        | 15 min      | All routes (default)                      |
| **Authentication** | 100 req          | 5 req          | 15 min      | `/auth/signin`, `/auth/signup`, etc.      |
| **User Ops**       | 100 req          | 10 req         | 5 min       | `/user/check-email`                       |
| **Health Check**   | 1,000 req        | 60 req         | 1 min       | `/api-health/server`, `/api-health/database` |

### Timing Constants

All time windows use constants from `shared/constants/timing.constant.ts`:
- `TIMING.MINUTES_ONE_IN_MS` (60,000 ms)
- `TIMING.MINUTES_FIVE_IN_MS` (300,000 ms)
- `TIMING.MINUTES_FIFTEEN_IN_MS` (900,000 ms)

## Configuration

### Server Setup

**Location**: `server/start.ts`

```typescript
import { GLOBAL_RATE_LIMIT } from './constants/rate-limit.constant.ts';
await app.register(rateLimitFastify, GLOBAL_RATE_LIMIT);
```

### Route-Specific Overrides

```typescript
import { AUTH_RATE_LIMIT } from '../../../constants/rate-limit.constant.ts';

fastify.post('/signin', {
  config: {
    rateLimit: AUTH_RATE_LIMIT
  },
  schema: { /* ... */ }
}, handler);
```

## Response Headers

**On every request:**
```http
x-ratelimit-limit: 5
x-ratelimit-remaining: 3
x-ratelimit-reset: 1704067200
```

**When limit exceeded:**
```http
retry-after: 30
```

## Error Response

**Status**: 429 Too Many Requests

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Too many authentication attempts. Please wait 5 minutes before trying again.",
  "retryAfter": 245
}
```

## Testing

### Using curl

```bash
# Test rate limit (should block after 5 attempts in production)
for i in {1..6}; do
  curl -X POST http://localhost:5173/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}' \
    -i
done
```

### Check Headers

```bash
curl -X POST http://localhost:5173/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  -i | grep -i ratelimit
```

## Security Features

### IP-Based Limiting

- Each unique IP gets their own quota
- Development IPs (127.0.0.1, ::1) are allow-listed (no rate limiting during local development)
- Users behind same NAT/proxy share the same limit

### Key Generation

```typescript
// Global/Health: IP address (hashed)
keyGenerator: (request) => {
  const rawKey = request.ip;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// Auth/User: IP + email (hashed)
keyGenerator: (request) => {
  const { isPlainObject } = ObjectUtilsHelper;
  const body = request.body;
  const email = (isPlainObject(body) && 'email' in body && typeof body.email === 'string' && body.email.toLowerCase()) || 'anonymous';
  const rawKey = `${request.ip}-${email}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}
```

**Benefits:**
- Privacy (hashed keys)
- Per-user rate limiting (for auth routes)
- Consistent key length

### Logging

Rate limit violations are logged:

```typescript
const createOnExceededHandler = (bucket: string) => {
  return (request: FastifyRequest): void => {
    log.warn(
      {
        bucket,
        ip: request.ip,
        route: request.url,
      },
      `Rate limit exceeded for "${bucket}" bucket`
    );
  };
};

// Usage
onExceeded: createOnExceededHandler('auth')
```

### User-Friendly Messages

Auth and User rate limits include formatted retry times:
- **< 1 minute**: "30 seconds"
- **≥ 1 minute**: "5 minutes"

## Customization

### Creating Custom Rate Limits

**Example**: `server/constants/rate-limit.constant.ts`

```typescript
const MY_CUSTOM_RATE_LIMIT: RateLimitPluginOptions = {
  addHeaders: {
    'retry-after': true,
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true
  },
  errorResponseBuilder: (_request, context) => {
    const retryAfterSeconds = Math.ceil(context.ttl / SECONDS_ONE_IN_MS);
    const retryTimeFormatted = formatRetryTime(retryAfterSeconds);
    
    return {
      error: 'Too Many Requests',
      message: `Custom message. Please wait ${retryTimeFormatted}.`,
      retryAfter: retryAfterSeconds,
      statusCode: 429
    };
  },
  keyGenerator: (request) => {
    const rawKey = request.ip;
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  },
  max: IS_DEVELOPMENT ? 500 : 50,
  onExceeded: createOnExceededHandler('my-custom'),
  timeWindow: TIMING.MINUTES_TEN_IN_MS
};
```

## Monitoring

### Log Messages

```
✅ Rate limiting plugin registered
```

### Track Violations

Monitor these metrics:
1. **429 response rate**: High values indicate limits or attacks
2. **Per-endpoint 429s**: Identify abused endpoints
3. **Unique IPs hitting limits**: Distinguish attacks from traffic spikes

## OpenAPI Documentation

All rate-limited endpoints document the 429 response:

```typescript
response: {
  429: {
    content: { 'application/json': { schema: rateLimitErrorSchema } }
  }
}
```

## Troubleshooting

### Hitting Limits in Development

1. Check using localhost (127.0.0.1 or ::1)
2. Increase development limits in config
3. Clear browser cache/cookies
4. Wait for time window to reset

### Rate Limits Not Working

1. Verify plugin registered in logs
2. Check route configuration
3. Test with curl to eliminate browser caching

### Users Behind Proxies

- Consider user-based rate limiting post-authentication
- Increase limits slightly for shared IPs
- Use `X-Forwarded-For` header (with caution)

## Future Enhancements

1. **User-based rate limiting** (after authentication)
2. **Different limits for authenticated vs anonymous**
3. **IP banning** for persistent offenders
4. **Distributed rate limiting** with Redis (multi-server deployments)

## Related Documentation

- [SECURITY.md](./SECURITY.md) - Security considerations
- [ROUTE_IMPLEMENTATION.md](./ROUTE_IMPLEMENTATION.md) - Applying rate limits to routes
- [ERROR_LOGGING.md](./ERROR_LOGGING.md) - Rate limit violation logging

## Resources

- [@fastify/rate-limit Documentation](https://github.com/fastify/fastify-rate-limit)
- [IETF Draft: RateLimit Header Fields](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers)
