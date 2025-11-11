# Routing Authentication Documentation

## Overview

This document describes the authentication and session management system built on **React Router v7** with server-side rendering (SSR). The system uses a **client ID-based approach** to coordinate cache hydration between server and client, ensuring consistent authentication state across the request lifecycle.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [Request Flow](#request-flow)
4. [Client ID System](#client-id-system)
5. [Cookie Management](#cookie-management)
6. [Authentication State](#authentication-state)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Key Concepts

The authentication system is built on several key architectural decisions:

1. **Client ID Coordination**: A unique `client-id` cookie ties together SSR queries and client-side hydration
2. **AsyncLocalStorage**: Server-side request context management without prop drilling
3. **React Router Middleware**: Authentication checks happen at the routing layer
4. **Zustand State Management**: Client-side session state with React Context
5. **React Query Cache**: Coordinated cache hydration between server and client

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Incoming Request                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               appLayoutMiddleware                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Check access-token cookie                        │   │
│  │ 2. Get/Create client-id                             │   │
│  │ 3. Fetch auth data (if authenticated)               │   │
│  │ 4. Store auth data in route context                 │   │
│  │ 5. Set client-id cookie (if new)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                appLayoutLoader                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Retrieve auth data from context                  │   │
│  │ 2. Get client-id                                     │   │
│  │ 3. Return { clientId, isAuthenticated }             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  AppLayout Component                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ClientSessionProvider (Zustand store)                │   │
│  │   - clientId                                         │   │
│  │   - isAuthenticated                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Child Components                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ useClientSessionTrackedValue()                       │   │
│  │   - Access clientId                                  │   │
│  │   - Access isAuthenticated                           │   │
│  │   - Use in React Query queries                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. ClientIdRouteContext

**Location**: `client/contexts/client-id-route.context.ts`

Server-side context management using Node's AsyncLocalStorage. Manages the client ID lifecycle during SSR.

**Key Functions**:

```typescript
// Check if user has access token
const hasToken = hasAccessToken();

// Get existing client ID or create new one
const clientId = await getOrCreateClientId(clientIdCookie);

// Get client ID only for authenticated users
const clientId = await getClientId(clientIdCookie);

// Wrap request handling in context
return run(request, async () => {
  // Your request handling logic
});
```

**Why AsyncLocalStorage?**

AsyncLocalStorage provides request-scoped state without prop drilling. Each request gets its own isolated context that persists throughout the async call chain.

### 2. CookieHelper

**Location**: `client/helpers/cookie.helper.ts`

Utility functions for cookie management using React Router's Cookie API.

**Key Functions**:

```typescript
// Create cookie configuration
const myCookie = createStandardCookie("cookie-name");

// Parse cookie from header
const value = await parseCookie(myCookie, cookieHeader);

// Check cookie existence
const exists = await hasCookie(myCookie, cookieHeader);

// Set cookie on response
await setCookie(response, myCookie, value, maxAgeInSeconds);
```

**Cookie Configuration**:

- `httpOnly: true` - JavaScript cannot access (security)
- `sameSite: "strict"` - CSRF protection
- `secure: !IS_DEVELOPMENT` - HTTPS only in production
- `path: "/"` - Available across entire site

### 3. ClientSessionProvider

**Location**: `client/providers/ClientSessionProvider/`

React Context + Zustand store for client-side session state.

**Purpose**:

- Provides `clientId` and `isAuthenticated` to all child components
- Maintains consistency between server-rendered and client-side state
- Enables React Query cache coordination

**Structure**:

```
ClientSessionProvider/
├── ClientSessionProvider.tsx      # Main provider component
├── contexts/
│   └── client-session.context.ts  # React Context definition
├── hooks/
│   ├── useClientSessionContext.ts # Hook to access context
│   └── useClientSessionTrackedValue.ts # Hook with tracked values
├── stores/
│   └── client-session.store.ts    # Zustand store factory
└── types/
    └── client-session.type.ts     # TypeScript types
```

### 4. Middleware & Loader

**Middleware** (`client/layouts/AppLayout/middlewares/app-layout.middleware.ts`):

- Runs before loader
- Handles authentication verification
- Sets client-id cookie
- Stores auth data in route context

**Loader** (`client/layouts/AppLayout/loaders/app-layout.loader.ts`):

- Retrieves auth data from context
- Passes `clientId` and `isAuthenticated` to layout
- Triggers React Query hydration

---

## Request Flow

### Authenticated User Request

```
1. Request arrives → appLayoutMiddleware
   │
   ├─→ Check for access-token cookie ✓
   │
   ├─→ Check for client-id cookie
   │   ├─→ Exists: Parse and use
   │   └─→ Missing: Generate new ID
   │
   ├─→ Fetch auth data from backend
   │   Query Key: ["auth", "verify", clientId]
   │
   ├─→ Store auth data in route context
   │
   └─→ Set client-id cookie (if new)

2. appLayoutLoader
   │
   ├─→ Retrieve auth data from context
   │
   ├─→ Get client-id
   │
   └─→ Return { clientId, isAuthenticated: true }

3. AppLayout renders
   │
   └─→ ClientSessionProvider initializes
       ├─→ clientId: "abc123..."
       └─→ isAuthenticated: true

4. Child components
   │
   └─→ useClientSessionTrackedValue()
       ├─→ Access clientId for queries
       └─→ React Query hydrates with matching key
```

### Unauthenticated User Request

```
1. Request arrives → appLayoutMiddleware
   │
   ├─→ Check for access-token cookie ✗
   │
   └─→ Skip auth verification, continue

2. appLayoutLoader
   │
   └─→ Return { clientId: null, isAuthenticated: false }

3. AppLayout renders
   │
   └─→ ClientSessionProvider initializes
       ├─→ clientId: ""
       └─→ isAuthenticated: false

4. Child components
   │
   └─→ useClientSessionTrackedValue()
       └─→ isAuthenticated: false
           (Skip authenticated queries)
```

---

## Client ID System

### Purpose

The client ID serves as a **cache coordination key** to ensure that:

1. Server-side fetched data matches client-side cache keys
2. React Query can hydrate properly without refetching
3. Multiple tabs/windows from the same user have isolated caches

### Lifecycle

```typescript
// 1. Server generates or retrieves client ID
const clientId = await getOrCreateClientId(clientIdCookie);
// Result: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// 2. Used in query key on server
queryOptions({
  queryKey: ["auth", "verify", clientId],
  queryFn: () => verifyAuth(),
});

// 3. Sent to client via loader data
return data({ clientId, isAuthenticated });

// 4. Stored in Zustand via ClientSessionProvider
<ClientSessionProvider clientId={clientId} isAuthenticated={isAuthenticated}>

// 5. Used in query key on client
const { clientId } = useClientSessionTrackedValue("clientId");
useQuery({
  queryKey: ["auth", "verify", clientId],
  queryFn: () => verifyAuth(),
});
```

### Why Not Use Session ID?

**Client ID** ≠ **Session ID**

- **Session ID**: Identifies a user session on the server
- **Client ID**: Coordinates React Query cache between SSR and client
- Client ID is **ephemeral** (5-minute cookie)
- Client ID is **per-browser-context** (not per user)

---

## Cookie Management

### Cookies Used

| Cookie Name    | Purpose             | Duration  | Security                                            |
| -------------- | ------------------- | --------- | --------------------------------------------------- |
| `access-token` | User authentication | Varies    | HttpOnly, Secure, SameSite=Strict, Encrypted+Signed |
| `client-id`    | Cache coordination  | 5 minutes | HttpOnly, Secure, SameSite=Strict                   |

### Cookie Flow

```typescript
// Server-side: Read cookies via AsyncLocalStorage
const cookieHeader = request.headers.get("cookie");
const clientId = await CookieHelper.parseCookie(clientIdCookie, cookieHeader);

// Server-side: Set cookies via Response headers
await CookieHelper.setCookie(response, clientIdCookie, clientId, 300);

// Result in Set-Cookie header:
// client-id=abc123; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=300; Expires=<date>
```

### Cookie Security

**Built-in protections**:

1. **HttpOnly**: JavaScript cannot access → XSS protection
2. **Secure**: HTTPS only in production → MITM protection
3. **SameSite=Strict**: No cross-site requests → CSRF protection
4. **Short-lived**: 5-minute expiration → Limited exposure window

**Access token additional protections**:

- Encrypted with AES-256-GCM
- Signed with HMAC
- Server-side only (see `server/helpers/cookie.helper.ts`)

---

## Authentication State

### Server-Side State

Stored in **React Router route context** (`authRouteContext`):

```typescript
// Middleware sets the context
context.set(authRouteContext, authData);

// Loader retrieves from context
const authData = context.get(authRouteContext);
```

**Data Structure**:

```typescript
interface VerifyAuthListData {
  identity_id: string;
  timestamp: string;
  // ... other auth fields
}
```

### Client-Side State

Stored in **Zustand store** via `ClientSessionProvider`:

```typescript
interface ClientSessionState {
  clientId: string; // "abc123..." or ""
  isAuthenticated: boolean; // true or false
}
```

**Access Pattern**:

```typescript
// In components
const { clientId, isAuthenticated } = useClientSessionTrackedValue(
  "clientId",
  "isAuthenticated"
);

// Reactive to changes
if (isAuthenticated) {
  // Fetch user-specific data
}
```

---

## Usage Examples

### Example 1: Protected Route Check

```typescript
// In a loader or component
const { isAuthenticated } = useClientSessionTrackedValue("isAuthenticated");

if (!isAuthenticated) {
  throw redirect("/login");
}
```

### Example 2: Authenticated Query

```typescript
import { useQuery } from "@tanstack/react-query";
import { useClientSessionTrackedValue } from "@client/providers/ClientSessionProvider";

function MyComponent() {
  const { clientId, isAuthenticated } = useClientSessionTrackedValue(
    "clientId",
    "isAuthenticated"
  );

  const { data } = useQuery({
    queryKey: ["user", "profile", clientId],
    queryFn: () => fetchUserProfile(),
    enabled: isAuthenticated && !!clientId,
  });

  return <div>{data?.name}</div>;
}
```

### Example 3: Custom Middleware

```typescript
// In a custom middleware
import { ClientIdRouteContext } from "@client/contexts/client-id-route.context";

const myMiddleware: Route.MiddlewareFunction = async ({ request }, next) => {
  const { run, hasAccessToken } = ClientIdRouteContext;

  return run(request, async () => {
    if (!hasAccessToken()) {
      throw redirect("/login");
    }

    return next();
  });
};
```

### Example 4: Server-Side Cookie Access

```typescript
import { CookieHelper } from "@client/helpers/cookie.helper";

const myLoader = async ({ request }: Route.LoaderArgs) => {
  const customCookie = CookieHelper.createStandardCookie("my-cookie");
  const cookieHeader = request.headers.get("cookie");
  const value = await CookieHelper.parseCookie(customCookie, cookieHeader);

  return { value };
};
```

---

## Best Practices

### 1. Always Use Client ID in Query Keys

**✅ Good**:

```typescript
queryKey: ["resource", "list", clientId];
```

**❌ Bad**:

```typescript
queryKey: ["resource", "list"]; // Missing clientId
```

**Why**: Without clientId, SSR and client caches won't match, causing unnecessary refetches.

### 2. Check Authentication State

**✅ Good**:

```typescript
const { isAuthenticated, clientId } = useClientSessionTrackedValue(
  "isAuthenticated",
  "clientId"
);

useQuery({
  queryKey: ["user", "data", clientId],
  queryFn: fetchUserData,
  enabled: isAuthenticated && !!clientId,
});
```

**❌ Bad**:

```typescript
// Always runs, even when not authenticated
useQuery({
  queryKey: ["user", "data"],
  queryFn: fetchUserData,
});
```

### 3. Use AsyncLocalStorage Context

**✅ Good**:

```typescript
const { run } = ClientIdRouteContext;

return run(request, async () => {
  // All async operations have access to request context
  const clientId = await getOrCreateClientId(clientIdCookie);
  return processRequest(clientId);
});
```

**❌ Bad**:

```typescript
// Request context not available in async operations
const clientId = await getOrCreateClientId(clientIdCookie);
```

### 4. Cookie Duration

**Guidelines**:

- Short-lived data: 5 minutes (like client-id)
- Long-term data: Use encrypted, signed cookies only (like access-token)

### 5. Error Handling

**✅ Good**:

```typescript
try {
  const queryClient = await fetchServerData([
    getVerifyAuthQueryOptions(clientId),
  ]);
  context.set(authRouteContext, authData);
} catch {
  // Gracefully handle auth failures
  context.set(authRouteContext, null);
}
```

---

## Troubleshooting

### Issue: Queries Refetching on Client

**Symptom**: Data fetched on server is refetched immediately on client

**Causes**:

1. Query keys don't match between server and client
2. `clientId` is different or missing
3. Query options differ (staleTime, cacheTime)

**Solution**:

```typescript
// Verify query keys match
// Server (middleware):
queryKey: ["auth", "verify", clientId];

// Client (component):
queryKey: ["auth", "verify", clientId]; // Must be identical!
```

### Issue: Client ID Always Null

**Symptom**: `clientId` is `null` or empty string in components

**Causes**:

1. User is not authenticated (expected behavior)
2. Cookie not being set/parsed correctly
3. AsyncLocalStorage context not available

**Solution**:

```typescript
// Check if user is authenticated
const { isAuthenticated } = useClientSessionTrackedValue("isAuthenticated");
console.log({ isAuthenticated }); // Should be true

// Verify middleware is running
// Add logging in appLayoutMiddleware
console.log("Client ID:", clientId);
```

### Issue: Cookies Not Being Set

**Symptom**: Client ID cookie doesn't appear in browser

**Causes**:

1. Middleware not awaiting `setCookie`
2. Response headers not being modified
3. Browser rejecting cookie (Secure flag on HTTP)

**Solution**:

```typescript
// Ensure await
await CookieHelper.setCookie(response, clientIdCookie, clientId, maxAge);

// Check environment
console.log({ IS_DEVELOPMENT }); // Should be true for HTTP dev environments
```

### Issue: Authentication State Mismatch

**Symptom**: Server says authenticated, client says not authenticated

**Causes**:

1. Loader data not properly passed to provider
2. ClientSessionProvider not wrapping components
3. Hook called outside provider

**Solution**:

```typescript
// Verify AppLayout structure
<ClientSessionProvider clientId={clientId} isAuthenticated={isAuthenticated}>
  {/* Components must be children */}
  <Outlet />
</ClientSessionProvider>;

// Verify hook usage
// Must be inside ClientSessionProvider tree
const value = useClientSessionTrackedValue("isAuthenticated");
```

### Issue: AsyncLocalStorage Undefined

**Symptom**: `Cannot read property 'getStore' of null`

**Causes**:

1. Calling context functions outside of `run()` callback
2. Not in SSR environment

**Solution**:

```typescript
// Always wrap in run()
return ClientIdRouteContext.run(request, async () => {
  const clientId = await getOrCreateClientId(cookie);
  // ... rest of logic
});
```

---

## Security Considerations

### 1. Client ID is NOT Secret

The client ID is:

- ✅ Safe to expose to client
- ✅ Used for cache coordination
- ❌ NOT used for authentication
- ❌ NOT a security token

### 2. Access Token is Secret

The access token is:

- ✅ HttpOnly (JavaScript cannot access)
- ✅ Encrypted + Signed
- ✅ Server-side validation only
- ❌ NEVER sent to client code

### 3. Cookie Security Headers

```typescript
// Automatically applied by CookieHelper
{
  httpOnly: true,         // XSS protection
  secure: !IS_DEVELOPMENT, // HTTPS in production
  sameSite: "strict",     // CSRF protection
}
```

### 4. CSRF Protection

- `SameSite=Strict` prevents cross-site requests
- All mutations should verify origin
- Consider CSRF tokens for sensitive operations

---

**Questions?** Check the source code or reach out to the development team.
