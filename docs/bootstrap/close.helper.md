# `close.helper.ts` — graceful Fastify shutdown wiring

## What this helper does

It wires two pieces of cleanup behavior onto the Fastify app:

1. **Signal-driven shutdown** — when the Node process receives a termination signal (`SIGINT` from Ctrl+C, `SIGTERM` from a `kill` command, etc.), the app drains its in-flight work and closes its plugins **before** the process exits.
2. **HMR-safe re-evaluation** — under `vite-node --watch`, the bootstrap module is re-evaluated on every file save. Each re-eval would normally pile on a fresh set of process-level signal listeners and leave the old app instance dangling. This helper notices the previous evaluation's app, tears it down, and registers the new one cleanly.

End result: pressing Ctrl+C drains gracefully on the first attempt, and saving a file during dev does not leak signal handlers or leave a dead app instance lying around.

## Public surface

```ts
const CloseHelper = Object.freeze({
  setupCloseListeners,
} as const);
```

One function:

```ts
setupCloseListeners(app: FastifyInstance): Promise<CloseWithGraceReturn>
```

It returns the handle that `close-with-grace` produces. Callers keep that handle so they can trigger a manual close later — the shutdown route uses it to stand the server down when a newer sibling instance asks to take over the port.

## Implementation walkthrough

### Step 1 — close the prior instance, if any

```ts
const prior = globalThis.__priorInstance;

if (prior) {
  prior.handle.uninstall();
  await prior.app.close();
}
```

`globalThis.__priorInstance` is a slot on the global object — it survives module re-evaluation. Module-scope variables are wiped when `vite-node` re-evaluates a file, but `globalThis` (and the Node process) live on across re-evals, so we use it as the rendezvous point between the old evaluation and the new one.

When the new bootstrap runs, it asks: "Was there an older app set up before me?" If yes:

- `prior.handle.uninstall()` — removes the **process-level** listeners that the old `close-with-grace` registered (for `SIGINT`, `SIGTERM`, `uncaughtException`, `unhandledRejection`, etc.). Without this, every dev-server reload would stack a fresh layer of handlers, and on shutdown each one would fire in turn.
- `await prior.app.close()` — tells the old Fastify app to shut down its server, drain plugin `onClose` hooks, and release the port. This is the **direct** close — not the close-with-grace one.

**Important — we do NOT call `prior.handle.close()` here.** `close-with-grace` always finishes its run by calling `process.exit(0)`. That's the right thing when a real shutdown signal arrived (we should exit), but during HMR re-eval the **new** instance is already alive in the same process. Calling `handle.close()` would tear that one down too.

### Step 2 — register the new close-with-grace handle

```ts
const closeListeners = closeWithGrace(
  { delay: GRACEFUL_SHUTDOWN_TIMEOUT_MS, logger: app.log },
  async ({ signal, manual, err: error }) => { ... }
);
```

What `closeWithGrace(config, callback)` does, in plain English:

- Subscribes to process-level termination events: OS signals (`SIGINT`, `SIGTERM`, etc.), `uncaughtException`, and `unhandledRejection`.
- When one fires, it invokes your callback.
- After your callback resolves **or** `delay` ms have passed (whichever is first), the library calls `process.exit`. The `delay` is your maximum grace window — the deadline for in-flight work to finish before the process is forced down.
- In this codebase `delay` comes from `TIMING.GRACEFUL_SHUTDOWN_TIMEOUT_MS` (10 seconds).

### Step 3 — the shutdown callback

The callback receives a payload describing **why** shutdown was triggered:

| Field    | Meaning                                                                                  |
| -------- | ---------------------------------------------------------------------------------------- |
| `signal` | An OS signal name (e.g. `"SIGINT"`), or `undefined`.                                     |
| `manual` | `true` when shutdown was triggered programmatically (someone called `handle.close()`).    |
| `err`    | An `Error` when shutdown was triggered by an uncaught exception or unhandled rejection.   |

The callback branches on these to log an appropriate message, then closes the app:

```ts
if (error) {
  app.log.error({ err: error }, "server closing with error");
} else if (manual) {
  app.log.info("Another instance started (manual). Shutting down gracefully.");
} else {
  app.log.info(
    (signal && SIGNALS_ERROR_MESSAGES.get(signal))
      ?? "Shutdown signal received. Shutting down gracefully.",
  );
}

await app.close();
```

- The `manual` branch text — "Another instance started" — reflects the only place a manual close currently happens: when a sibling dev-server instance hits our `/internal/shutdown` route and asks us to stand down.
- `SIGNALS_ERROR_MESSAGES` is a `Map<Signals, string>` of human-readable text per signal name. The `??` fallback covers the rare case where `signal` is `undefined` even though neither `manual` nor `error` was set.
- `app.close()` is Fastify's own shutdown — closes the HTTP server, drains in-flight requests, and unwinds plugin `onClose` hooks.

### Step 4 — pin the new instance to `globalThis`

```ts
globalThis.__priorInstance = { app, handle: closeListeners };
```

Stash the live app and its close-with-grace handle in the global slot so the **next** HMR re-eval can find and clean it up. This is the inverse of Step 1.

### Step 5 — return the handle

The caller (`bootstrap.module.ts`) needs the handle to register the shutdown route. The route uses `handle.close()` to drive the **manual** branch of the callback when a peer instance asks for shutdown.

## Edge cases & gotchas

- **HMR fail-safe**: if the prior instance crashed between Step 4 and the next Step 1, `__priorInstance` still points at a defunct app. `app.close()` on an already-closed Fastify app is a no-op, so the cleanup is robust.
- **Manual close from the shutdown route**: how a freshly started dev-server asks the **already running** dev-server to stand down — not via HMR (different process), but via HTTP across two separate `pnpm dev` processes both wanting the same port.
- **Windows + `SIGTERM`**: `SIGTERM` on Windows is unconditional — it terminates the target without giving close-with-grace a chance to run. That's why the cooperative HTTP path (the shutdown route) is preferred over the kill fallback whenever both are options.

## How it fits in

`setupCloseListeners` runs **first** inside `bootstrapServer`, before route registration and before the port-claim attempt. Order matters:

1. **Install shutdown handlers first** — if anything later throws, the cleanup path is already in place.
2. Register the `/internal/shutdown` route, passing it the `closeListeners` handle.
3. Attempt to claim the port (with the cooperative-shutdown fallback chain if it's taken).
