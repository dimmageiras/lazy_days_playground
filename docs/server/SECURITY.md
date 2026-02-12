# Security Implementation Guide

## Overview

The application implements defense-in-depth security with multiple layers protecting against common web vulnerabilities (OWASP Top 10).

## Security Layers

```
HTTP Security Headers (Helmet)
  → Rate Limiting
  → Authentication Middleware
  → Input Validation (Zod)
  → Encrypted Cookies
  → Database Access Control (GEL)
```

## HTTP Security Headers

**Location**: `server/inits/security/security.init.ts`

Helmet is configured with conditional application based on request type:

```typescript
// Register helmet with global: false for conditional application
await app.register(helmet, {
  global: false, // Disable automatic application to all routes
  contentSecurityPolicy: IS_DEVELOPMENT
    ? false
    : { directives: CSP_DIRECTIVES, useDefaults: false },
  crossOriginEmbedderPolicy: !IS_DEVELOPMENT,
  enableCSPNonces: !IS_DEVELOPMENT,
  hsts: {
    includeSubDomains: true,
    maxAge: YEARS_ONE_IN_S, // 1 year
    preload: true,
  },
});

// Apply helmet conditionally based on route type
app.addHook("onRequest", async (request, reply) => {
  const isAsset =
    request.url.startsWith("/assets/") || request.url === "/favicon.ico";

  // For asset routes, apply full helmet with CSP
  if (isAsset) {
    reply.helmet();
    return;
  }

  // For non-asset routes (React Router, API), disable CSP to allow dynamic content
  reply.helmet({
    contentSecurityPolicy: false,
  });
});
```

### Applied Headers

| Header                         | Value/Purpose                                     |
| ------------------------------ | ------------------------------------------------- |
| `Strict-Transport-Security`    | Forces HTTPS (1 year, includeSubDomains, preload) |
| `X-Content-Type-Options`       | `nosniff` - Prevents MIME sniffing                |
| `Content-Security-Policy`      | Controls resource loading (see CSP section)       |
| `X-DNS-Prefetch-Control`       | `off` - Prevents DNS prefetch leaks               |
| `X-Download-Options`           | `noopen` - Prevents IE drive-by downloads         |
| `Cross-Origin-Embedder-Policy` | `require-corp` - Restricts cross-origin resources |

## Content Security Policy (CSP)

**Location**: `server/constants/csp.constant.ts`

### Key Directives

| Directive          | Value                                    | Protection                          |
| ------------------ | ---------------------------------------- | ----------------------------------- |
| `baseUri`          | `'self'`                                 | Prevents base tag injection attacks |
| `connectSrc`       | `'self'`, `ws:`, `wss:`                  | WebSocket connections for Vite HMR  |
| `defaultSrc`       | `'self'`                                 | Fallback for unspecified directives |
| `fontSrc`          | `'self'`, `https://fonts.gstatic.com`    | Google Fonts                        |
| `formAction`       | `'self'`                                 | Restricts form submission targets   |
| `frameAncestors`   | `'none'`                                 | Prevents clickjacking               |
| `imgSrc`           | `'self'`, `data:`                        | Allows self and data URIs           |
| `objectSrc`        | `'none'`                                 | Blocks plugins (Flash, etc.)        |
| `reportUri`        | `/api/reports/csp/report`                | CSP violation reporting endpoint    |
| `scriptSrc`        | `'self'`                                 | Only same-origin scripts            |
| `styleSrc`         | `'self'`, `https://fonts.googleapis.com` | Same-origin styles and Google Fonts |
| `upgradeInsecure…` | `[]`                                     | Upgrades HTTP to HTTPS              |

**Note**: CSP disabled in development for React DevTools compatibility. In production, CSP is disabled for non-asset routes (e.g., React Router pages, API routes) to allow proper CSP nonce handling in the response pipeline, while asset routes (`/assets/*`, `/favicon.ico`) receive full helmet protection.

### CSP Violation Reporting

**Endpoint**: `POST /api/reports/csp/report` (see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md))

Browsers automatically send violation reports when CSP policies are violated. Reports are stored in `default::CspReport` with IP tracking for monitoring security issues, policy misconfigurations, and potential XSS attacks.

**Configuration**: Add `reportUri` directive in `server/constants/csp.constant.ts`

```typescript
const CSP_DIRECTIVES = {
  reportUri: ["/api/reports/csp/report"],
};
```

## Cookie Security

### Configuration

```typescript
await app.register(cookieFastify, {
  parseOptions: {
    httpOnly: true,
    sameSite: "strict",
    secure: !IS_DEVELOPMENT,
  },
  secret: COOKIE_SECRET,
});
```

### Security Features

1. **HttpOnly**: Not accessible via JavaScript (XSS protection)
2. **SameSite='strict'**: Prevents CSRF attacks
3. **Secure**: HTTPS-only in production
4. **Signed**: HMAC signature prevents tampering

### Cookie Encryption

**Algorithm**: AES-256-GCM with scrypt key derivation

**Location**: `server/helpers/encryption.helper.ts`

```typescript
// Encrypt
const encrypted = await encryptData(plaintext);
// Format: salt.iv.authTag.encryptedData (all base64)

// Decrypt
const decrypted = await decryptData(encrypted);
```

**Features:**

- Random salt per encryption
- Random IV per encryption
- Authentication tag (detects tampering)
- Slow key derivation (brute force resistant)

### Using Encrypted Cookies

```typescript
import { CookieHelper } from "../helpers/cookie.helper.ts";
const { getEncryptedCookie } = CookieHelper;

// Read encrypted cookie (automatically decrypts + verifies signature)
const token = await getEncryptedCookie(request, ACCESS_TOKEN);

// Set encrypted cookie
const encrypted = await encryptData(jwtToken);
response.setCookie(ACCESS_TOKEN, encrypted, {
  httpOnly: true,
  maxAge: MINUTES_FIFTEEN_IN_S,
  sameSite: "strict",
  secure: !IS_DEVELOPMENT,
  signed: true,
});
```

## Authentication & Authorization

### Authentication Middleware

**Location**: `server/middleware/auth.middleware.ts`

**Flow:**

1. Extract encrypted cookie
2. Verify signature
3. Decrypt token
4. Validate JWT (expiration + structure)
5. Attach user to request

```typescript
import { authMiddleware } from "../middleware/auth.middleware.ts";

fastify.get(
  "/protected",
  {
    preHandler: [authMiddleware],
    schema: {
      /* ... */
    },
  },
  handler,
);
```

### Token Storage

✅ **DO:**

- Store in httpOnly cookies
- Encrypt before storage
- Sign cookies
- Use short expiration (15 min access, 7 days refresh)

❌ **DON'T:**

- Store in localStorage/sessionStorage (XSS vulnerable)
- Store plaintext tokens
- Use long-lived tokens without refresh

### JWT Validation

**Location**: `server/helpers/auth-validation.helper.ts`

```typescript
const { isValid, identityId, expiresAt } = await validateAuthToken(token);

if (!isValid) {
  response.clearCookie(ACCESS_TOKEN);
  return response.status(401).send({ error: "Invalid or expired token" });
}

request.user = { identity_id: identityId, expiresAt };
```

## Rate Limiting

Prevents brute force attacks and abuse.

**See:** [RATE_LIMITING.md](./RATE_LIMITING.md) for comprehensive details

### Key Configurations

| Tier               | Limit (Production) | Time Window | Applied To                    |
| ------------------ | ------------------ | ----------- | ----------------------------- |
| **Authentication** | 5 req              | 15 min      | Login, signup, logout, verify |
| **User Ops**       | 10 req             | 5 min       | Email checks, profile ops     |
| **Health Check**   | 60 req             | 1 min       | Health checks, CSP reports    |
| **Global**         | 100 req            | 15 min      | All other endpoints           |

### Security Features

- IP-based limiting (hashed keys for privacy)
- Email-based limiting for auth routes
- Automatic 429 responses with retry-after
- Violation logging

## Input Validation

All user input validated with Zod schemas before processing.

**Example:**

```typescript
const requestSchema = zObject({
  email: zEmail().meta({ description: "...", example: "..." }),
  password: zString()
    .min(8)
    .max(128)
    .meta({ description: "...", example: "..." }),
});

fastify.post(
  "/endpoint",
  {
    schema: { body: requestSchema },
  },
  handler,
);
```

**Automatic:**

- Validation on every request
- 400 Bad Request on failure
- Type-safe request.body

**See:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for schema details

## Error Handling

### Global Error Handler

**Location**: `server/start.ts`

```typescript
app.setErrorHandler((error, request, response) => {
  log.error({ error, requestId, statusCode, url, stack });

  // Sanitize 5xx errors (hide internal details)
  if (response.statusCode >= 500) {
    return response.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
    });
  }

  // Pass through 4xx errors (safe client errors)
  return response.send(error);
});
```

**Benefits:**

- Prevents information leakage
- Logs all errors with full context
- Returns safe, consistent responses

**See:** [ERROR_LOGGING.md](./ERROR_LOGGING.md) for logging patterns

## Database Security

### Connection Security

```typescript
const gelClient = createClient({ dsn: GEL_AUTH_BASE_URL }); // TLS enabled
await gelClient.ensureConnected();
```

**Note**: The main server uses `GEL_AUTH_BASE_URL` for the connection pool. Individual routes may use `GEL_DSN` for specific database operations.

### Query Parameterization

Always use parameterized queries:

```typescript
// ✅ SAFE
await gelClient.query(
  `
  SELECT User { id, email }
  FILTER .email = <str>$email
`,
  { email },
);

// ❌ DANGEROUS - Never do this
await gelClient.query(`
  SELECT User FILTER .email = '${email}'
`);
```

### Password Storage

GEL Auth handles password hashing automatically (bcrypt or similar):

```typescript
// Signup - hashes password
await Auth.signUp({ email, password });

// Signin - compares hashed
await Auth.signIn({ email, password });
```

## Environment Variables

Store sensitive configuration in environment variables, never in code.

**Critical Variables:**

```bash
# Cookie security (REQUIRED)
COOKIE_SECRET="generate-with-openssl-rand-hex-32"

# Database connection for auth (REQUIRED - used by main server)
GEL_AUTH_BASE_URL="gel://user:password@host:port/database?tls_security=strict"

# Database connection for direct queries (REQUIRED - used by some routes)
GEL_DSN="gel://user:password@host:port/database?tls_security=strict"
```

**Note**: Both variables are typically set to the same DSN value. `GEL_AUTH_BASE_URL` is used for the main server connection pool, while `GEL_DSN` is used by specific routes that create their own client connections.

### Generating Secrets

```bash
# Cookie secret (256-bit)
openssl rand -hex 32

# Database password
openssl rand -base64 32
```

### Security Best Practices

✅ **DO:**

- Use `.env` file (gitignored)
- Generate strong random secrets
- Rotate secrets periodically
- Use different secrets per environment
- Store production secrets in secure vault

❌ **DON'T:**

- Commit `.env` to version control
- Use weak or default secrets
- Share secrets via email/Slack
- Reuse secrets across projects
- Log environment variables

## OWASP Top 10 Mitigation

| Vulnerability                      | Mitigation                                               |
| ---------------------------------- | -------------------------------------------------------- |
| **1. Injection**                   | Parameterized queries, input validation, output encoding |
| **2. Broken Authentication**       | Secure token storage, expiration, rate limiting          |
| **3. Sensitive Data Exposure**     | HTTPS/TLS, cookie encryption, password hashing           |
| **4. XML External Entities (XXE)** | JSON-only API (N/A)                                      |
| **5. Broken Access Control**       | Auth middleware, resource ownership checks               |
| **6. Security Misconfiguration**   | Helmet headers, CSP, environment-based config            |
| **7. Cross-Site Scripting (XSS)**  | CSP, React escaping, input validation, HttpOnly cookies  |
| **8. Insecure Deserialization**    | JSON only, schema validation, type safety                |
| **9. Known Vulnerabilities**       | Regular updates, `npm audit`                             |
| **10. Insufficient Logging**       | Comprehensive logging, request tracking                  |

## Development vs Production

| Feature           | Development                    | Production                  |
| ----------------- | ------------------------------ | --------------------------- |
| **HTTPS**         | Not required                   | Required (`secure` flag)    |
| **CSP**           | Disabled (DevTools compatible) | Fully enforced              |
| **Rate Limits**   | 10-200x higher                 | Strict                      |
| **Error Details** | Verbose                        | Sanitized (no stack traces) |

## Deployment Checklist

Before deploying to production:

- [ ] Set `VITE_APP_IS_DEVELOPMENT=false`
- [ ] Generate strong `COOKIE_SECRET`
- [ ] Configure `GEL_AUTH_BASE_URL` with TLS
- [ ] Configure `GEL_DSN` with TLS
- [ ] Enable HTTPS/TLS on server
- [ ] Test rate limiting
- [ ] Verify cookie security flags
- [ ] Test authentication flow
- [ ] Set up log aggregation
- [ ] Configure error monitoring
- [ ] Enable database backups
- [ ] Review CORS policy
- [ ] Perform security audit

## Security Best Practices

1. ✅ **Validation**: Always use Zod schemas
2. ✅ **Authentication**: Protected routes use middleware
3. ✅ **Encryption**: Sensitive cookies encrypted + signed
4. ✅ **Rate Limiting**: Applied to sensitive endpoints
5. ✅ **Error Handling**: Sanitize 5xx errors
6. ✅ **Logging**: Security events tracked, sensitive data excluded
7. ✅ **Database**: Parameterized queries only
8. ✅ **HTTPS**: Required in production
9. ✅ **Updates**: Regular dependency updates
10. ✅ **Secrets**: Environment variables only

## Vulnerability Prevention

### XSS (Cross-Site Scripting)

- CSP blocks inline scripts
- React auto-escapes content
- HttpOnly cookies not accessible to JS
- Input validation

### CSRF (Cross-Site Request Forgery)

- SameSite='strict' cookies
- Custom headers for API requests

### SQL Injection

- Parameterized database queries
- Input validation with Zod

### Brute Force

- Rate limiting (5 attempts per 15 min for auth)
- Account lockout patterns
- Logging and monitoring

### Clickjacking

- CSP `frameAncestors: 'none'`
- X-Frame-Options header

## Incident Response

### Detection

Monitor for:

- Unusual authentication failures
- Rate limit violation spikes
- Unexpected database queries
- Suspicious error patterns

### Immediate Actions

1. Identify affected systems
2. Block malicious IPs (if applicable)
3. Revoke compromised tokens
4. Enable additional rate limiting

### Investigation

- Export relevant logs
- Analyze affected users
- Identify attack patterns
- Determine breach timeline

## Related Documentation

- [RATE_LIMITING.md](./RATE_LIMITING.md) - Rate limiting configuration
- [ERROR_LOGGING.md](./ERROR_LOGGING.md) - Security event logging
- [ROUTE_IMPLEMENTATION.md](./ROUTE_IMPLEMENTATION.md) - Secure route implementation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Input validation patterns

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Security Headers Test](https://securityheaders.com/)
