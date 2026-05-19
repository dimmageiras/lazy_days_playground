# `shutdown-request.helper.ts` — cooperative shutdown client

## What this helper does

This is the **client half** of the cooperative-shutdown protocol. When a freshly started dev-server instance discovers that the port is already taken, it makes an HTTP POST to the running instance's `/internal/shutdown` route, asking it to stand down gracefully. The route handler on the other side is documented in `shutdown.route.md`.

End result: two `pnpm dev` invocations targeting the same port can hand off cleanly — the older one drains its in-flight work and exits, the newer one claims the port.

## Public surface

```ts
const ShutdownRequestHelper = Object.freeze({
  requestCooperativeShutdown,
} as const);
```

```ts
requestCooperativeShutdown(config: ShutdownRequestConfig): Promise<boolean>
```

where

```ts
interface ShutdownRequestConfig {
  port: number;
  token: string;
}
```

The function returns `true` if the peer responded with a successful status (axios resolves on any 2xx by default), `false` on **any** failure — network error, timeout, non-2xx, the peer not running, etc. The caller doesn't get a structured error reason; it only needs to know whether to wait for the port or escalate to the force-kill path.

## Implementation walkthrough

### Build the URL

```ts
const url = `${HTTP}//${LOOPBACK_HOST_V4}:${port}${SHUTDOWN}` as const;
```

The pieces:

- `HTTP` is `"http:"` (with the trailing colon) — that's the WHATWG URL-style protocol constant.
- `LOOPBACK_HOST_V4` is `"127.0.0.1"`.
- `port` is the port the caller is trying to claim.
- `SHUTDOWN` is the path `/internal/shutdown`.

Putting it together: `"http://127.0.0.1:5173/internal/shutdown"`.

**Watch out for the template** — it reads `${HTTP}//...` with only **two** slashes after `HTTP`, not three. That's because `HTTP` already ends in `:` (`"http:"`). Writing `${HTTP}://` would produce `"http:://..."` and axios would reject the URL with `ERR_INVALID_URL`. The single-colon convention comes from the shared constants module, which uses the same WHATWG-style suffixed protocol strings that the `URL` constructor returns from `.protocol`.

The `as const` on the assignment narrows the type to the exact string literal — useful if anything downstream needs to discriminate on it, and harmless otherwise.

### Send the POST

```ts
await axios.post(
  url,
  {},
  {
    headers: {
      "content-type": "application/json",
      [SHUTDOWN_TOKEN_HEADER]: token,
    },
    signal: AbortSignal.timeout(SHUTDOWN_REQUEST_TIMEOUT_MS),
  },
);
```

A few things to notice:

- **Empty body** (`{}`). The route doesn't need any payload — the authentication header is the only meaningful input.
- **`content-type: application/json`** is set explicitly. Axios would set it automatically when given an object body, but stating it is clear and avoids any surprise if the body type changes later.
- **The shutdown token header**. The route only honors the request if the header matches the expected token (see `shutdown.route.md`). The header key is `x-shutdown-token`, exported as `HEADERS.SHUTDOWN_TOKEN_HEADER`. The header **must** match exactly — the route uses a timing-safe comparison.
- **`signal: AbortSignal.timeout(...)`** is the modern way to cap how long the request can take. `AbortSignal.timeout(ms)` returns an `AbortSignal` that auto-aborts after `ms` milliseconds. Axios respects the signal and aborts the in-flight request when it fires.

`SHUTDOWN_REQUEST_TIMEOUT_MS` is 2 seconds. That's intentionally tight — if the peer hasn't responded in 2 s, it's probably not going to, and the caller is better off escalating to the force-kill path than waiting.

#### Why a header-based token instead of an IP allow-list alone?

The route also checks that the request comes from a loopback IP. But on a shared machine, anyone with shell access could `curl` the loopback. The token is the second factor — only the dev-server's parent process knows the token (it's generated and held in `SERVER_SETTINGS.SHUTDOWN_TOKEN`), so only its sibling instances can produce a valid request.

#### Why `AbortSignal.timeout` instead of axios's `timeout` option?

Both work. `AbortSignal.timeout` is the platform-standard way to express the same intent (the same `signal` parameter is also accepted by `fetch`, `setTimeout`, and most modern Node APIs), and it composes with `AbortController` if a higher-level caller ever needs to cancel for a different reason. Plus the cancellation it produces is a real `AbortError`, which is easier to recognise than axios's `ECONNABORTED` flavor.

### Success / failure outcome

```ts
try {
  await axios.post(url, ...);
  return true;
} catch {
  return false;
}
```

The `try`/`catch` collapses every failure into `false`. From the caller's perspective there's nothing actionable about distinguishing "connection refused" from "timeout" from "non-2xx" — in all three cases the next step is the same: try `tryListenUntil` (in case the port freed despite the apparent failure), then fall back to `killPortOwner`. Returning a boolean keeps the caller's branching simple.

## Edge cases & gotchas

- **The other instance isn't running**: connection refused. We return `false`. The caller then tries the force-kill fallback (which on Windows uses `netstat -ano` to find any process holding the port).
- **The other instance accepted the request but didn't release the port in time**: this helper still returns `true` because the HTTP response was successful. The caller hands off to `tryListenUntil` to wait for the actual port release, with its own separate timeout.
- **Wrong token**: the route returns 401, axios throws on non-2xx by default (per axios's `validateStatus`), so we land in the catch and return `false`. The caller escalates to force-kill. This is the correct behavior — if you ever get token drift between the running and starting instances, you fall back to the heavier-handed path automatically.
- **DNS / IPv6**: the URL pins `127.0.0.1` (IPv4). There's no DNS lookup and no IPv6 fallback. That's intentional — the cooperative protocol is loopback-only by design.

## How it fits in

In the port-claim chain:

```
1. tryListen(app, port)
   ↓ false (EADDRINUSE)
2. requestCooperativeShutdown({ port, token })  ← this helper
   ↓ true  → tryListenUntil(app, port, COOPERATIVE_HANDOVER_TIMEOUT_MS) → done
   ↓ false → escalate to killPortOwner(port, SIGTERM, log)
3. ...
```

This helper is the **first** escalation step — the friendliest way to ask for the port. If it works, in-flight requests on the prior instance complete properly and the handover happens cleanly. If it fails, the caller falls back to harder mechanisms.
