# `listen.helper.ts` — port-binding with retry

## What this helper does

This helper wraps Fastify's `app.listen` with two ergonomic variants that the bootstrap chain needs:

- **`tryListen`** — attempt to bind the port **once**, return `true` on success, return `false` if the port is taken, **re-throw** any other error.
- **`tryListenUntil`** — keep calling `tryListen` with exponential backoff until either the bind succeeds or a deadline passes.

The split exists because the bootstrap chain needs both behaviors at different points:

- The **first attempt** uses `tryListen` — we want a single shot before deciding whether to escalate.
- After we've asked the prior owner to stand down (cooperative or forced), we want to **wait for the port to free** — that's `tryListenUntil`.

## Public surface

```ts
const ListenHelper = Object.freeze({
  tryListen,
  tryListenUntil,
} as const);
```

```ts
tryListen(app: FastifyInstance, port: number): Promise<boolean>
tryListenUntil(app: FastifyInstance, port: number, timeoutMs: number): Promise<boolean>
```

Both resolve to `true` on a successful bind, `false` when the port is still in use after they give up. Non-`EADDRINUSE` errors **propagate** out — those mean something else is wrong (permissions, bad host, etc.) and the bootstrap chain treats them as fatal.

## Implementation walkthrough

### Type guard for Node errors

```ts
const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;
```

Node's system errors are `Error` objects with an extra `code` property (e.g. `"EADDRINUSE"`, `"EACCES"`). Strictly typed code can't read `error.code` off `unknown`. This narrowing function tells TypeScript "if I confirm `error` is an `Error` with a `code` field, treat it as `NodeJS.ErrnoException`" — after which `error.code` is safely readable.

We use it instead of `error instanceof Error && (error as any).code === "EADDRINUSE"` because the type guard expresses the intent and avoids the `any`.

### `tryListen`

```ts
const tryListen = async (
  app: FastifyInstance,
  port: number,
): Promise<boolean> => {
  try {
    await app.listen({ port, host: BIND_ALL_IPV4 });
    return true;
  } catch (error) {
    if (isErrnoException(error) && error.code === "EADDRINUSE") {
      return false;
    }
    throw error;
  }
};
```

A single, minimal listen attempt. Three outcomes:

| Outcome           | Branch                            | What it means                                                  |
| ----------------- | --------------------------------- | -------------------------------------------------------------- |
| Bind succeeded    | returns `true`                    | Port is ours; the HTTP server is now accepting connections.    |
| Port taken        | returns `false` (EADDRINUSE)      | Someone else is listening — the caller decides what to do.     |
| Anything else     | re-throws                         | Permission denied, bad host, etc. — fatal, propagate up.       |

**About `host: BIND_ALL_IPV4`** (`"0.0.0.0"`): this binds the socket on **all IPv4 interfaces** of the host (loopback `127.0.0.1`, LAN address, etc.). Using `"localhost"` instead would let the OS pick either v4 or v6 and could surprise tools that connect specifically to one stack. Sticking to a literal IPv4 bind-all keeps the behavior predictable.

**Why `EADDRINUSE` returns `false` instead of throwing**: the bootstrap chain treats "port taken" as a normal control-flow event — it triggers the cooperative-shutdown handshake. Throwing for it would force every caller into a try/catch where the catch is just "see if the error code is `EADDRINUSE` to decide which fallback to run." Returning a boolean keeps the call sites flat.

### `tryListenUntil`

```ts
const tryListenUntil = async (
  app: FastifyInstance,
  port: number,
  timeoutMs: number,
): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  let interval: number = LISTEN_POLL_INITIAL_INTERVAL_MS;

  while (Date.now() < deadline) {
    if (await tryListen(app, port)) {
      return true;
    }
    await delay(interval);
    interval = Math.min(
      Math.round(interval * 2.5),
      LISTEN_POLL_MAX_INTERVAL_MS,
    );
  }

  return false;
};
```

The polling-retry wrapper. Walked through:

1. **Compute a deadline**: `Date.now() + timeoutMs`. Using a single timestamp (rather than tracking elapsed time inside the loop) keeps the loop condition simple and is robust to overhead between iterations.
2. **Start the poll interval small** (`LISTEN_POLL_INITIAL_INTERVAL_MS`, 100ms). The port often frees within a few hundred ms after we ask the prior owner to close, so a tight initial poll gets us in fast.
3. **Loop**:
   - Try the bind. If it works, return `true` immediately.
   - Otherwise sleep for `interval` ms.
   - Grow the interval by 2.5x (rounded), capped at `LISTEN_POLL_MAX_INTERVAL_MS` (500ms). This is **exponential backoff with a ceiling** — common pattern to avoid hammering the OS while still being responsive when the port frees quickly.
4. **If the deadline passes**, return `false`. The caller decides whether to escalate or abort.

#### Why exponential backoff with a cap?

- **Linear polling** (every 100ms forever) wastes effort once it's clear the port isn't freeing soon. After 10 attempts you've made 10 calls without learning anything new.
- **Pure exponential growth** (100, 250, 625, 1562...) responds nicely at first but quickly drifts to multi-second waits that are useless inside a short overall budget like 11 seconds.
- **Capped exponential** combines the best of both: fast early attempts when the port is likely to free, smooth tail when it's not, no unnecessary OS pressure.

#### Why not use `setInterval`?

`setInterval` fires regardless of whether the previous tick finished. If `tryListen` ever took longer than the interval, ticks would overlap. The `await delay(interval)` pattern guarantees the previous attempt is fully done (including waiting for the OS to refuse the bind) before the next one begins.

## Edge cases & gotchas

- **Clock changes**: the deadline is computed once from `Date.now()`. If system time jumps backward during the poll, the deadline never expires (in practice this is rare and the bootstrap is short-lived enough not to care).
- **Sub-100ms timeouts**: if `timeoutMs` is smaller than `LISTEN_POLL_INITIAL_INTERVAL_MS`, `tryListenUntil` makes **one** attempt and returns. The deadline is checked at the top of the loop, so a single failed try plus the first sleep would already exceed the budget.
- **`EADDRINUSE` is the only "soft" failure**: any other listen error propagates out of `tryListen` and unwinds the polling loop. Good — the caller's try/catch in `bootstrapServer` logs and aborts, which is the right call for things like `EACCES`.

## How it fits in

In `bootstrapServer`:

```
tryListen(app, port)
  ↓ false → cooperative HTTP shutdown
  ↓ true on either path → done

requestCooperativeShutdown → 202?
  ↓ yes → tryListenUntil(app, port, COOPERATIVE_HANDOVER_TIMEOUT_MS)

killPortOwner → ok?
  ↓ yes → tryListenUntil(app, port, FORCE_SHUTDOWN_TIMEOUT_MS)
  ↓ no  → one last tryListen, then abort
```

The two functions sit at exactly the right granularity for each step:

- `tryListen` is the **single-shot bind probe** — used as the first attempt and as the final post-kill rescue.
- `tryListenUntil` is the **wait-for-port** primitive — used whenever we've just asked someone to free the port and we need to give them time.
