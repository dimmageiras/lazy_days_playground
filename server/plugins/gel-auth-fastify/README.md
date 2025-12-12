# Gel Auth Fastify Plugin

A Fastify plugin that provides authentication functionality using Gel's `@gel/auth-core` library for email/password authentication flows.

## Overview

The `gel-auth-fastify` plugin is a wrapper around `@gel/auth-core` that provides email/password authentication handlers for Gel database applications. It supports:

- User sign-in with email/password
- User registration (signup) with email/password
- Email verification for new registrations

## Installation

This plugin is part of the `lazy_days_playground` project and is located at `server/plugins/gel-auth-fastify/`. It depends on:

- `@gel/auth-core` (^0.3.1)
- `gel` (^2.2.0)
- `fastify` (^5.6.2)

## Quick Start

```typescript
import { createGelAuth } from "@server/plugins/gel-auth-fastify";
import { Client } from "gel";

// Create a Gel client
const client = new Client({ dsn: "gel://..." });

// Create the auth instance
const auth = createGelAuth(client);

// Use the email/password handlers
const { emailPasswordHandlers } = auth;
const { signin, signup, verifyRegistration } = emailPasswordHandlers;

// Example usage in a route handler
const result = await signin("user@example.com", "SecurePassword123");
```

## API Reference

### `createGelAuth(client: Client): GelAuthInstance`

Factory function that creates a Gel authentication instance.

**Parameters:**

- `client: Client` - A configured Gel database client instance

**Returns:**

- `GelAuthInstance` - An object containing authentication handlers

### `GelAuthInstance`

```typescript
interface GelAuthInstance {
  emailPasswordHandlers: EmailPasswordHandlers;
}
```

### `EmailPasswordHandlers`

```typescript
interface EmailPasswordHandlers {
  signin: (email: string, password: string) => Promise<AuthTokenData>;
  signup: (
    email: string,
    password: string,
    verifyUrl: string
  ) => Promise<SignupResult>;
  verifyRegistration: (
    verificationToken: string,
    verifier: string
  ) => Promise<AuthTokenData>;
}
```

## Authentication Handlers

### `signin(email: string, password: string)`

Authenticates an existing user with email and password.

**Parameters:**

- `email: string` - User's email address
- `password: string` - User's password

**Returns:**

- `Promise<AuthTokenData>` - Authentication token data on success

**Throws:**

- `UserError` - When authentication fails (invalid credentials, etc.)

### `signup(email: string, password: string, verifyUrl: string)`

Creates a new user account with email and password.

**Parameters:**

- `email: string` - User's email address
- `password: string` - User's password (must be 8-50 characters with at least one uppercase letter, one lowercase letter, and one number)
- `verifyUrl: string` - URL for email verification (should handle the verification flow)

**Returns:**

- `Promise<SignupResult>` - Result indicating if signup is complete or requires verification

**Throws:**

- `UserError` - When signup fails (user already exists, invalid data, etc.)

### `verifyRegistration(verificationToken: string, verifier: string)`

Verifies a user's email address using a verification token.

**Parameters:**

- `verificationToken: string` - Token from the verification email
- `verifier: string` - Verifier string for the verification process

**Returns:**

- `Promise<AuthTokenData>` - Authentication token data on successful verification

**Throws:**

- `UserError` - When verification fails (invalid token, expired, etc.)

## Type Definitions

### Request Body Types

```typescript
interface SigninRequestBody {
  Body: {
    email: string;
    password: string;
  };
}

interface SignupRequestBody {
  Body: {
    email: string;
    password: string; // Must be 8-50 characters with at least one uppercase, one lowercase, and one number
    confirmPassword: string; // Must match password
  };
}

interface VerifyRequestBody {
  Body: {
    verificationToken: string;
    verifier: string;
  };
}
```

### Response Types

The plugin directly uses return types from `@gel/auth-core` methods. The actual types are:

```typescript
// AuthTokenData is the return type of Auth.signinWithEmailPassword and Auth.verifyEmailPasswordSignup
type AuthTokenData = Awaited<ReturnType<Auth["signinWithEmailPassword"]>>;

// SignupResult is the return type of Auth.signupWithEmailPassword
type SignupResult = Awaited<ReturnType<Auth["signupWithEmailPassword"]>>;
```

These types include:

- `auth_token`: JWT authentication token
- `identity_id`: Unique identifier for the authenticated user
- `status`: Signup completion status (`"complete"` | `"verificationRequired"`)
- `verifier`: PKCE verifier for email verification flow
- Additional metadata depending on the operation

For type safety, the plugin's TypeScript interfaces use these underlying `@gel/auth-core` types rather than redefining them.

The `SignupResult` type includes:

- `status`: Either `"complete"` (no verification needed) or `"verificationRequired"` (email verification required)
- `verifier`: PKCE verifier string for the verification process
- `tokenData`: Authentication token data (only present when `status` is `"complete"`)
- `identity_id`: User identity ID (only present when `status` is `"verificationRequired"`)`}

## Usage Example

```typescript
import { createGelAuth } from "@server/plugins/gel-auth-fastify";
import { Client } from "gel";

// Create a Gel client
const client = new Client({ dsn: "gel://..." });

// Create the auth instance
const auth = createGelAuth(client);
const { emailPasswordHandlers } = auth;

// Use in a Fastify route handler
app.post("/signin", async (request, reply) => {
  const { email, password } = request.body;

  try {
    const tokenData = await emailPasswordHandlers.signin(email, password);
    // Store token in secure cookie or return to client
    return reply.send({
      success: true,
      identity_id: tokenData.identity_id,
      auth_token: tokenData.auth_token,
    });
  } catch (error) {
    return reply.status(401).send({ error: "Authentication failed" });
  }
});

// Signup example with email verification
app.post("/signup", async (request, reply) => {
  const { email, password } = request.body;

  try {
    const result = await emailPasswordHandlers.signup(
      email,
      password,
      `${request.protocol}://${request.hostname}/verify`
    );

    if (result.status === "complete") {
      // User can sign in immediately
      return reply.send({
        success: true,
        identity_id: result.tokenData.identity_id,
        status: result.status,
      });
    } else {
      // Email verification required
      return reply.send({
        success: true,
        status: result.status,
        message: "Please check your email for verification instructions",
      });
    }
  } catch (error) {
    return reply.status(400).send({ error: "Registration failed" });
  }
});

// Email verification example
app.post("/verify", async (request, reply) => {
  const { verificationToken, verifier } = request.body;

  try {
    const tokenData = await emailPasswordHandlers.verifyRegistration(
      verificationToken,
      verifier
    );

    return reply.send({
      success: true,
      identity_id: tokenData.identity_id,
      auth_token: tokenData.auth_token,
    });
  } catch (error) {
    return reply.status(400).send({ error: "Verification failed" });
  }
});
```

## Error Handling

The plugin can throw various error types from `@gel/auth-core` and `gel`. Here are the main error types you should handle:

### Authentication Errors (`UserError`)

- Thrown for general authentication failures (invalid credentials, etc.)
- Use for sign-in failures and general auth issues

### Data Validation Errors (`InvalidDataError`)

- Thrown when provided data doesn't meet requirements (invalid email format, password too weak, etc.)
- Commonly thrown during signup and sign-in

### Identity Not Found (`NoIdentityFoundError`)

- Thrown when trying to authenticate with non-existent credentials
- Common during sign-in attempts

### User Already Registered (`UserAlreadyRegisteredError`)

- Thrown during signup when the email is already registered
- Specific to signup operations

### Verification Errors (`VerificationError`)

- Thrown during email verification when tokens are invalid
- Common during the verify registration process

### Verification Token Expired (`VerificationTokenExpiredError`)

- Thrown when verification tokens have expired
- Specific to email verification flow

### PKCE Verification Failed (`PKCEVerificationFailedError`)

- Thrown when PKCE verification fails during email verification
- Related to the email verification process

### Database Errors

- `QueryError`: Database query failures
- `BackendError`: Gel backend errors
- `InvalidReferenceError`: Invalid database references

### Example Error Handling

```typescript
import {
  UserError,
  InvalidDataError,
  NoIdentityFoundError,
  UserAlreadyRegisteredError,
  VerificationError,
  VerificationTokenExpiredError,
  PKCEVerificationFailedError,
} from "@gel/auth-core";
import { QueryError, BackendError } from "gel";

try {
  const tokenData = await emailPasswordHandlers.signin(email, password);
} catch (error) {
  if (error instanceof NoIdentityFoundError) {
    // Invalid credentials
    return reply.status(401).send({ error: "Invalid email or password" });
  } else if (error instanceof InvalidDataError) {
    // Invalid data format
    return reply
      .status(400)
      .send({ error: "Invalid email or password format" });
  } else if (error instanceof UserError) {
    // General auth error
    return reply.status(401).send({ error: "Authentication failed" });
  } else {
    // Handle other errors (QueryError, BackendError, etc.)
    return reply.status(500).send({ error: "Service temporarily unavailable" });
  }
}
```

## Dependencies

- `@gel/auth-core` (^0.3.1): Core authentication logic and error types
- `gel` (^2.2.0): Gel database client
- `fastify` (^5.6.2): Web framework

## License

This plugin is part of the `lazy_days_playground` project. See the main project license for details.
