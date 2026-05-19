# Bootstrap module — implementation walkthroughs

Per-file walkthroughs for the server's bootstrap module, aimed at junior engineers. Each doc covers purpose, public surface, an annotated implementation walkthrough, edge cases, and how the file fits into the wider port-claim and shutdown flow.

## What the module does

It owns the process-lifecycle plumbing around Fastify:

- Claims the configured TCP port. If the port is already taken, it asks the previous owner to step aside through a cooperative HTTP handshake before falling back to OS-level termination.
- Installs graceful shutdown handlers so signals (`SIGINT`, `SIGTERM`, …), uncaught exceptions, and dev-server HMR re-evals all drain in-flight work cleanly.
- Exposes an internal HTTP route so future sibling instances can request a graceful handover from this one.

The goal of these docs: a reader who has never seen the codebase can open one file, follow the doc, and understand both **what** the code does and **why** it's shaped that way.

## Reading order

Start at the top and work down. Each doc cross-links to its neighbours when they share state or call each other.

1. [`bootstrap.module.md`](./bootstrap.module.md) — the orchestrator. Composes the helpers below into `bootstrapServer`. Read this first to get the big picture; the rest fill in the building blocks.
2. [`close.helper.md`](./close.helper.md) — installs graceful shutdown handlers and survives dev-server HMR re-evals.
3. [`listen.helper.md`](./listen.helper.md) — single-shot and polling-with-backoff variants of `app.listen`.
4. [`shutdown-request.helper.md`](./shutdown-request.helper.md) — client half of the cooperative shutdown protocol (HTTP POST to a sibling instance).
5. [`shutdown.route.md`](./shutdown.route.md) — server half of the same protocol. Loopback IP gate, timing-safe token check, per-reply close trigger.
6. [`kill.helper.md`](./kill.helper.md) — Windows-only force-kill fallback. PID lookup via `netstat -ano` plus `process.kill`.

## Quick reference — the port-claim chain

```
tryListen
  ↓ false (EADDRINUSE)
requestCooperativeShutdown
  ↓ true  → tryListenUntil(COOPERATIVE_HANDOVER_TIMEOUT_MS) → done
  ↓ false (or wait timed out)
killPortOwner(SIGTERM)
  ↓ ok: false → tryListen once (rescue) → abort with reason-specific log
  ↓ ok: true
tryListenUntil(FORCE_SHUTDOWN_TIMEOUT_MS) → done | abort
```

Each step is documented in detail in the matching file's walkthrough.

## A note on scope

These docs are **file-specific walkthroughs**, not the codebase-agnostic concept docs the project's general doc-editing rule prefers. They name actual functions and constants and will need updating whenever those identifiers change. Treat them as onboarding material rather than long-term reference.
