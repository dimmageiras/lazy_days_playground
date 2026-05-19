# `shutdown.route.ts` — cooperative shutdown server

## What this route does

This is the **server half** of the cooperative-shutdown protocol — the counterpart to `shutdown-request.helper.md`. When a freshly started dev-server instance asks this one to stand down (so it can claim the port), this route handler validates the request and then triggers a graceful shutdown.

Two layered defenses make sure only legitimate sibling instances can trigger shutdown:

1. **Loopback IP allow-list** — the request must originate from the local machine.
2. **Shared secret token** — the request must carry a matching token header, compared in constant time.

Both checks must pass; if either fails, the route returns `401 Unauthorized` without disclosing **which** check failed.

## Public surface

```ts
const shutdownRoute: FastifyPluginAsync<ShutdownRouteOptions>;
```

```ts
interface ShutdownRouteOptions {
  readonly closeListeners: CloseWithGraceReturn;
  readonly token: string;
}
```

`shutdownRoute` is a plain Fastify plugin. The plugin's **registration options** carry both the `closeListeners` handle (from `close.helper.ts`) and the expected shutdown `token`, threaded in at `app.register(shutdownRoute, { closeListeners, token })` time. Both values are owned by the orchestrator and reach the plugin through the options bag rather than module-level state.

## Implementation walkthrough

### Token comparison — `isTokenValid`

```ts
const encodeLength = (length: number): Buffer =>
  Buffer.from(Uint32Array.of(length).buffer);

const isTokenValid = (provided: unknown, expected: string): boolean => {
  if (typeof provided !== "string") {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  const lengthMatches = timingSafeEqual(
    encodeLength(providedBuffer.length),
    encodeLength(expectedBuffer.length),
  );

  const sized = Buffer.alloc(expectedBuffer.length);

  providedBuffer.copy(sized, 0, 0, expectedBuffer.length);

  const bytesMatch = timingSafeEqual(sized, expectedBuffer);

  return bytesMatch && lengthMatches;
};
```

Two reasons this isn't `provided === expected`:

1. **Type narrowing**: incoming HTTP headers are typed as `string | string[] | undefined`. We only accept plain strings.
2. **Timing-safe comparison**: a naive `===` (or `Buffer.compare`) terminates **as soon as the first byte mismatches**. An attacker measuring response times could exploit that to recover the token one byte at a time. `crypto.timingSafeEqual` always compares all the bytes regardless of where the first mismatch is, so the timing carries no information about how close the guess was.

The function always runs `timingSafeEqual` over equal-length buffers, never short-circuiting on length:

- The length comparison is itself fed through `timingSafeEqual` — each length is encoded into a fixed-width `Uint32` buffer (`encodeLength`) so the two-buffer compare always covers identical lengths. A length mismatch and a byte mismatch therefore perform the same operations, and the response timing does not betray which check failed.
- The byte comparison sizes the provided value to the expected length via `Buffer.alloc(expectedBuffer.length)` + `providedBuffer.copy(...)`. Even when the provided buffer is shorter or longer than expected, `timingSafeEqual` runs over two equal-length buffers — there is no length pre-check branch that could leak through scheduling differences.

The `bytesMatch && lengthMatches` AND at the end is the **only** branch in the function, and both operands are computed unconditionally before it.

The buffers are created via `Buffer.from(...)` so we get raw byte sequences (UTF-8 encoded), which is what `timingSafeEqual` expects.

### Request handler

The second handler parameter is named `response`, not Fastify's conventional `reply`. This is a deliberate project preference: the value carries the response that will be sent to the client, and the local identifier reads more directly than the framework convention. The framework still types it as a `FastifyReply`; only the variable name diverges. Treat any mention of `response` here as the Fastify reply object.

```ts
app.post(SHUTDOWN, async (request, response) => {
  if (
    !LOOPBACK_HOSTS.has(request.ip) ||
    !isTokenValid(
      Reflect.get(request.headers, SHUTDOWN_TOKEN_HEADER),
      token,
    )
  ) {
    return response.code(UNAUTHORIZED).send({ ok: false });
  }

  response.raw.on("finish", () => {
    closeListeners.close();
  });

  return response.code(ACCEPTED).send({ ok: true });
});
```

Walked through in pieces:

#### 1. Path

```ts
app.post(SHUTDOWN, ...)
```

`SHUTDOWN` is `/internal/shutdown` — the `/internal` prefix is a convention for routes that are not part of the app's user-facing API.

#### 2. Loopback IP allow-list

```ts
!LOOPBACK_HOSTS.has(request.ip)
```

`LOOPBACK_HOSTS` is a `Set` containing the IPs Fastify can report for a local request:

- `127.0.0.1` — standard IPv4 loopback.
- `::1` — IPv6 loopback.
- `::ffff:127.0.0.1` — IPv4-mapped IPv6. The dual-stack OS surfaces IPv4 loopback connections as v4-mapped IPv6 when the server is bound to `"::"`. We don't currently bind to `"::"`, but listing it is cheap insurance against a future change to the bind host.

Anything else — including LAN, public, or NATted IPs — fails this check.

#### 3. Token check

```ts
!isTokenValid(
  Reflect.get(request.headers, SHUTDOWN_TOKEN_HEADER),
  token,
)
```

`Reflect.get(request.headers, SHUTDOWN_TOKEN_HEADER)` is functionally the same as `request.headers[SHUTDOWN_TOKEN_HEADER]`, but the explicit `Reflect.get` avoids tripping the `security/detect-object-injection` lint rule. The lookup returns the header value (as a string when sent normally, possibly `string[]` if duplicated, possibly `undefined`); `isTokenValid` rejects anything that isn't a single string.

#### 4. Single rejection path

Both checks are combined into one `if`. If **either** fails, the handler returns `401` and `{ ok: false }`. We deliberately don't tell the caller **which** check failed — a legitimate caller passes both, and an attacker would only learn signal about how close they are. Same response, same status, same shape.

This is what the inline comment in the file is recording — the goal is to leak as little as possible.

#### 5. Schedule the close **after** the response flushes

```ts
response.raw.on("finish", () => {
  closeListeners.close();
});
```

This is the subtle bit. `response.raw` is the underlying Node `ServerResponse` object. Its `"finish"` event fires **after the response bytes have been written to the socket** but before the socket has necessarily closed.

We hook into `"finish"` rather than calling `closeListeners.close()` directly because:

- If we called `close()` before sending the 202, the caller might never see the response — the connection could be torn down mid-write.
- If we called `close()` synchronously after `return response.code(ACCEPTED).send(...)`, Fastify hasn't actually written the response yet (`send` queues it), and we'd race against the write.
- Fastify's `onResponse` hook is **app-wide**: it would fire for **every** response, not just this one. We want a per-reply hook so it only fires for the shutdown request that we just authorized.

Listening on `response.raw`'s `"finish"` event is the per-reply, post-write hook we need.

`closeListeners.close()` triggers the `close-with-grace` callback with `manual: true`, which:

- Logs "Another instance started (manual). Shutting down gracefully."
- Calls `app.close()` to close the HTTP server and run plugin `onClose` hooks.
- Eventually calls `process.exit(0)` after the configured grace window.

#### 6. Return the 202

```ts
return response.code(ACCEPTED).send({ ok: true });
```

`202 Accepted` is the right code: the request has been accepted for processing, but the processing (the actual shutdown) happens **after** the response is sent. This is exactly what 202 was designed for.

## Edge cases & gotchas

- **Repeated requests during shutdown**: once `closeListeners.close()` is called, `close-with-grace` is idempotent — subsequent calls do nothing. So if a peer retries during the grace window, the retries don't cause harm.
- **The response finishes but the close-with-grace callback throws**: the request handler has already returned the 202, so the caller sees success either way. The error lands on the close-with-grace handler's own error path (logged via the Fastify logger).
- **Spoofed loopback IPs behind a misconfigured proxy**: Fastify sets `request.ip` based on the connection socket, **not** `X-Forwarded-For` (unless trust-proxy is configured). Out of the box, `request.ip` is trustworthy for this purpose.
- **Token rotation**: the token is captured at `app.register` time via the plugin options bag. Rotating the token after the route is registered would require re-registering the plugin. In practice the token is generated once at process start and lives for the lifetime of the process.

## How it fits in

The route is registered in `bootstrapServer` **before** the listen attempt:

```
1. setupCloseListeners(app)                                    → CloseWithGraceReturn handle
2. app.register(shutdownRoute, { closeListeners, token })      ← route mounted
3. tryListen / cooperative / kill chain                        ← claim the port
```

This ordering matters: by the time we ask the prior owner to shut down, our **own** shutdown route is already mounted. That way, if **another** instance starts up next and wants this port, we can hand it off the same way.

## Security recap

| Threat                                                | Mitigation                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| External attacker on the network triggers shutdown    | Loopback-only IP allow-list.                                        |
| Local user with shell access triggers shutdown        | Shared token only the parent process knows.                         |
| Timing attack reveals the token byte-by-byte          | `timingSafeEqual` constant-time comparison.                         |
| Token leaks via logs                                  | Pino redact path is configured for the `x-shutdown-token` header.   |
| Client receives shutdown before its request finishes  | Hook close on `response.raw`'s `"finish"`, not before.              |
| Caller learns which check failed (IP vs token)        | Single rejection branch, same response shape.                       |
