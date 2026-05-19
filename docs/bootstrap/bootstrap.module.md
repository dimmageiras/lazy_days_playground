# `bootstrap.module.ts` — the orchestrator

## What this module does

This is the **entry point** of the bootstrap module. It composes the helpers and the route into one function — `bootstrapServer` — that does three things in order:

1. **Install shutdown handlers** so the process can exit cleanly on signals or HMR re-eval.
2. **Mount the internal shutdown route** so future sibling instances can ask this one to stand down.
3. **Claim the port**, delegating to the port-claim helper which escalates through cooperative shutdown → force kill if the port is already taken.

If everything goes well, `bootstrapServer` resolves once Fastify is listening. If everything fails, the port-claim helper throws with a logged reason and the caller decides what to do.

## Public surface

```ts
bootstrapServer(config: BootstrapConfig): Promise<void>
```

```ts
interface BootstrapConfig {
  app: FastifyInstance;
  port: number;
  token: string;
}
```

- `app` — a fully configured Fastify instance. The module does **not** create the instance; the caller does, so user routes can be registered before bootstrap runs.
- `port` — the TCP port to claim.
- `token` — the shared secret used by the cooperative shutdown protocol. The same value is also used by the host caller to configure pino's redact path for the token header.

## The port-claim chain — at a glance

```
tryListen(app, port)
  ↓ true  → done
  ↓ false (EADDRINUSE)

requestCooperativeShutdown({ port, token })
  ↓ true  → tryListenUntil(app, port, COOPERATIVE_HANDOVER_TIMEOUT_MS)
            ↓ true  → done
            ↓ false → continue ↓
  ↓ false → continue ↓

killPortOwner(port, SIGTERM, log)
  ↓ ok: false → tryListen once (rescue)
                ↓ true  → done
                ↓ false → throw with reason-specific log
  ↓ ok: true

tryListenUntil(app, port, FORCE_SHUTDOWN_TIMEOUT_MS)
  ↓ true  → done
  ↓ false → throw
```

Read top-to-bottom: each step is tried only if the previous one didn't already succeed. The chain gets progressively harsher — friendly cooperative request first, OS signal last.

The chain itself lives in the **port-claim helper**, not in the orchestrator. The orchestrator just calls into it. The individual steps are documented in their matching helper docs:

- `tryListen` / `tryListenUntil` → [`listen.helper.md`](./listen.helper.md)
- `requestCooperativeShutdown` → [`shutdown-request.helper.md`](./shutdown-request.helper.md)
- `killPortOwner` → [`kill.helper.md`](./kill.helper.md)

The cooperative request mechanism on the server side (the loopback + token-checked HTTP endpoint that a sibling instance posts to) lives in [`shutdown.route.md`](./shutdown.route.md).

## Implementation walkthrough

The body of `bootstrapServer` is three lines:

```ts
const closeListeners = await setupCloseListeners(app);

await app.register(shutdownRoute, { closeListeners, token });
await claimPort({ app, port, token });
```

1. `setupCloseListeners(app)` wires the process-level shutdown handlers and produces the `closeListeners` handle. See [`close.helper.md`](./close.helper.md).
2. `app.register(shutdownRoute, { closeListeners, token })` mounts the cooperative-shutdown Fastify plugin, threading both the close handle and the shared token through the plugin's options bag. See [`shutdown.route.md`](./shutdown.route.md).
3. `claimPort({ app, port, token })` runs the port-claim chain (above). It resolves on three success branches — the initial listen, the cooperative-handover wait, the post-signal wait, or the rescue listen that runs after a failed kill attempt and catches a port that frees outside the polling window. Otherwise it throws with a logged reason.

Order matters: the close listeners and the shutdown route are set up **before** the port-claim attempt so that the moment we're listening, the shutdown endpoint is ready to receive requests from whatever instance starts up next. Registering the route before the listen also means it's mounted on the live HTTP server, not retrofitted afterwards.

## Edge cases & gotchas

The interesting edge cases all live in the port-claim chain (the helper), not the orchestrator:

- **Port becomes free between checks**: the chain has a rescue `tryListen` after a failed kill attempt so a port that frees outside the polling window is still caught.
- **Two new instances start simultaneously**: both get `EADDRINUSE`, both send cooperative requests to the prior instance. Whichever new instance wins the post-handover race becomes the new owner; the other escalates to force-kill or aborts.
- **Token mismatch between sibling instances**: the cooperative request returns false (the prior instance returns 401), and the new instance falls back to force-kill. The system still works, just less gracefully.
- **Running on macOS or Linux with the port held**: the cooperative path is the only viable option — the force-kill path short-circuits to `unsupported-platform`. If the cooperative path fails, the chain aborts and the port must be freed manually.

## How it fits in

`bootstrapServer` is the only thing the server entry script imports from this module (along with the shutdown-token-header constant used for pino redact). Everything else in the module is internal plumbing.

The caller's contract is simple: build your Fastify app and register your routes, then hand it to `bootstrapServer`. Either it resolves (and the app is live), or it throws with a logged reason.
