# Rate Limiting Configuration

## Overview

Rate limiting has been implemented to protect your API from abuse, brute force attacks, and to ensure fair resource allocation across all users.

## Configuration

All rate limit configurations are centralized in `server/constants/rate-limit.constant.ts`.

### Rate Limit Tiers

#### 1. **Global Rate Limit** (Default)

Applies to all routes unless overridden by route-specific limits.

- **Development**: 1,000 requests per 15 minutes
- **Production**: 100 requests per 15 minutes
- **Time Window**: `TIMING.MINUTES_FIFTEEN_IN_MS` (900,000 ms)
- **Purpose**: General API protection

#### 2. **Authentication Rate Limit** (Strict)

Applied to: `/auth/signin`, `/auth/signup`, `/auth/verify`

- **Development**: 100 requests per 15 minutes
- **Production**: 5 requests per 15 minutes
- **Time Window**: `TIMING.MINUTES_FIFTEEN_IN_MS` (900,000 ms)
- **Purpose**: Brute force attack prevention
- **Custom Error Message**: Includes retry-after time in seconds

**Example Response (429):**

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again in 245 seconds.",
  "retryAfter": 245
}
```

#### 3. **User Operations Rate Limit** (Moderate)

Applied to: `/user/check-email`

- **Development**: 100 requests per 5 minutes
- **Production**: 10 requests per 5 minutes
- **Time Window**: `TIMING.MINUTES_FIVE_IN_MS` (300,000 ms)
- **Purpose**: Email enumeration prevention
- **Custom Error Message**: Includes retry-after time in seconds

#### 4. **Health Check Rate Limit** (Relaxed)

Applied to: `/api-health/server`, `/api-health/database`

- **Development**: 1,000 requests per 1 minute
- **Production**: 60 requests per 1 minute
- **Time Window**: `TIMING.MINUTES_ONE_IN_MS` (60,000 ms)
- **Purpose**: Allow monitoring systems frequent checks

## Response Headers

All rate-limited endpoints include the following headers:

### On Every Request:

- `x-ratelimit-limit`: Maximum requests allowed in time window
- `x-ratelimit-remaining`: Requests remaining in current window
- `x-ratelimit-reset`: Timestamp when the rate limit resets
- `retry-after`: Seconds until the rate limit resets (when limit exceeded)

### Example Headers:

```http
x-ratelimit-limit: 5
x-ratelimit-remaining: 3
x-ratelimit-reset: 1704067200
```

## Implementation Details

### Server Setup

The rate limiting plugin is registered globally in `server/start.ts`:

```typescript
import { GLOBAL_RATE_LIMIT } from "./constants/rate-limit.constant.ts";

await app.register(rateLimitFastify, GLOBAL_RATE_LIMIT);
```

All rate limit configurations use centralized `TIMING` constants to ensure consistency across the application.

### Route-Specific Overrides

Individual routes override the global limit using the `config.rateLimit` option:

```typescript
import { AUTH_RATE_LIMIT } from "../../../constants/rate-limit.constant.ts";

fastify.post(
  "/signin",
  {
    config: {
      rateLimit: AUTH_RATE_LIMIT, // Uses TIMING.MINUTES_FIFTEEN_IN_MS internally
    },
    schema: {
      // ... schema definition
    },
  },
  async (request, reply) => {
    // ... handler
  }
);
```

## Testing Rate Limits

### Using curl:

```bash
# Test signin rate limit (should block after 5 attempts in production)
for i in {1..6}; do
  curl -X POST http://localhost:5173/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}' \
    -i
done
```

### Using JavaScript:

```javascript
// Check rate limit headers
const response = await fetch("http://localhost:5173/auth/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test@example.com", password: "test123" }),
});

console.log("Limit:", response.headers.get("x-ratelimit-limit"));
console.log("Remaining:", response.headers.get("x-ratelimit-remaining"));
console.log("Reset:", response.headers.get("x-ratelimit-reset"));
```

## Security Considerations

### IP-Based Limiting

Rate limits are applied per IP address by default. This means:

- ✅ Each unique IP gets their own quota
- ✅ Development IPs (127.0.0.1, ::1) have higher limits
- ⚠️ Users behind the same NAT/proxy share the same limit

### Bypass in Development

In development mode:

- Localhost/loopback IPs (127.0.0.1, ::1) are in the allowList
- Limits are 10-200x higher than production
- This allows easier testing without hitting limits

### Future Enhancements

Consider implementing:

1. **User-based rate limiting** (after authentication)
2. **Different limits for authenticated vs anonymous**
3. **IP banning** for persistent offenders
4. **Distributed rate limiting** with Redis (for multi-server deployments)

### Why TIMING Constants?

Using centralized timing constants provides several benefits:

- ✅ **Consistency**: All time values reference the same source
- ✅ **Type Safety**: Numeric milliseconds instead of string parsing
- ✅ **Maintainability**: Change time windows in one place
- ✅ **Clarity**: Semantic names over magic numbers
- ✅ **Reusability**: Same constants used across cookies, timeouts, and rate limits

## Customization

To adjust rate limits, edit `server/constants/rate-limit.constant.ts`:

```typescript
const AUTH_RATE_LIMIT: RateLimitPluginOptions = {
  max: IS_DEVELOPMENT ? 100 : 5, // Change these values
  timeWindow: TIMING.MINUTES_FIFTEEN_IN_MS, // Or use a different TIMING constant
  // ... other options
};
```

### Available TIMING Constants:

All time windows use centralized constants from `shared/constants/timing.constant.ts`.

**Commonly used for rate limiting:**

- `TIMING.MINUTES_ONE_IN_MS` (60,000 ms)
- `TIMING.MINUTES_FIVE_IN_MS` (300,000 ms)
- `TIMING.MINUTES_FIFTEEN_IN_MS` (900,000 ms)

**Note**:

- Rate limiting `timeWindow` uses **milliseconds** (e.g., `*_IN_MS` constants)
- Error message calculations use `TIMING.SECONDS_ONE_IN_MS` for ms-to-seconds conversion
- See `shared/constants/timing.constant.ts` for the complete list of available constants

## Monitoring

### Log Messages

Rate limit plugin logs:

```
[timestamp] INFO: ✅ Rate limiting plugin registered
```

### Tracking Violations

The plugin automatically tracks:

- Request count per IP
- Time window violations
- Reset timestamps

### Production Monitoring

Monitor these metrics:

1. **429 response rate**: High values indicate legitimate limits or attacks
2. **Per-endpoint 429s**: Identify which endpoints are being abused
3. **Unique IPs hitting limits**: Distinguish between attacks and legitimate traffic spikes

## OpenAPI Documentation

All rate-limited endpoints now document the 429 response in Swagger:

```yaml
responses:
  429:
    description: "Too many requests"
```

Visit your Swagger UI to see the updated API documentation with rate limit responses.

## Troubleshooting

### "Too Many Requests" in Development

If you're hitting rate limits while developing:

1. Check you're using localhost (127.0.0.1 or ::1)
2. Increase development limits in the config
3. Clear your browser cache/cookies
4. Wait for the time window to reset

### Rate Limits Not Working

1. Verify the plugin is registered: Check logs for "Rate limiting plugin registered"
2. Check route configuration: Ensure `config.rateLimit` is properly set
3. Test with curl to eliminate browser caching issues

### Users Behind Proxies

If users share IPs (corporate proxies, VPNs):

- Consider implementing user-based rate limiting post-authentication
- Increase limits slightly to accommodate shared IPs
- Use `X-Forwarded-For` header (with caution, as it can be spoofed)

## References

- [@fastify/rate-limit Documentation](https://github.com/fastify/fastify-rate-limit)
- [IETF Draft: RateLimit Header Fields](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers)

## Key Generation

Rate limits use custom key generators for granularity:

- **Global/Health**: Hashed IP address.
- **Auth/User**: Hashed combination of IP and email (lowercased, fallback to 'anonymous' if missing).
  Keys are hashed with SHA-256 for privacy and to handle length.

## Logging

- Each config has an `onExceeded` handler logging warnings with bucket, IP, and route.
- Central `onError` hook in start.ts logs all 429s with IP, route, user agent, and error.

## Extended Schemas

Rate limit error schemas are extended per-route (e.g., adding optional 'details' with meta) in schema files like database-route.schema.ts.
