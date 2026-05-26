# 0003. Single-port integrated stack

- **Status:** Proposed
- **Date:** 2026-05-26

## Context

The target runtime is a single Node process that hosts three concerns at once: the Fastify API, the React Router framework-mode SSR handler, and (in development) Vite's dev server mounted as middleware. The pattern is documented in detail in the multi-target Vite pattern doc; this ADR records the **port-reservation decision** that pattern depends on.

A single-process integrated stack means there is exactly one listener — one port — exposing every concern the project ships. That single port has to absorb three roles simultaneously: the API surface, the SSR HTML response, and the dev-time Vite asset / HMR traffic the SSR HTML references. A naive reading of the port number could lead a future contributor to two wrong conclusions: that it is an arbitrary value that can be moved freely, or that it collides with the default port of a tool that happens to use the same number (Vite's dev-server default) and should be moved to "fix" the collision. Both readings would break the integrated stack, the second one more subtly than the first — the value is deliberately the one any tool whose URL gets handed to a browser during development would otherwise want, precisely so the project owns the address rather than letting two tools fight over it.

The port reservation is in code today, hardcoded at the server bootstrap, pending the env-variable-loading slice that lands later. The reservation existed before any env wiring did, and the env wiring will keep the reserved value as the default; recording it here gives that default an audit-trail anchor independent of where the literal currently lives.

## Decision

The project reserves a **single port** for the integrated stack — Fastify + React Router SSR + Vite middleware in development, Fastify + React Router SSR (no Vite) in production. The reserved value is **`5173`**, currently hardcoded at the server bootstrap pending the env-loading slice.

The reservation is the decision; the literal value is the reserved instance. Changing the literal — for any reason, including a perceived collision with a tool default — requires a new ADR.

## Alternatives considered

### Two ports — one for the API, one for the client dev server

The classic split: Fastify on one port, Vite (or the React Router dev server) on another, with CORS or a dev proxy bridging them. Rejected because the integrated-stack pattern this project commits to is a single Node process serving every concern through one listener — splitting ports re-introduces the cross-origin, cross-process coordination the single-process design exists to avoid, and the production runtime would still collapse to one port, leaving the dev/prod parity worse than before.

### A different port number to avoid the "Vite default" collision

Move the listener to something Vite would not pick by default (e.g. 3000, 4000, 8080), on the assumption that overlap with the dev-server default is a configuration smell. Rejected because there is no collision — Vite does not bind a port in this project's dev flow; Vite is mounted as middleware on the Fastify listener and does not open its own server. Picking a different number specifically to avoid an imagined collision would make the reservation accidental rather than deliberate, and the next reader would draw the same wrong conclusion in reverse ("why isn't this on 5173?").

### Defer the port reservation until the env-loading slice lands

Leave the bootstrap pointing at whatever value is convenient now and pick the canonical value when env loading exists. Rejected because the integrated-stack pattern is already in force in code, and any non-reserved interim value would propagate into shell scripts, browser bookmarks, and team muscle memory before the env slice arrived. Reserving the value now and treating the hardcode as a temporary surface for the same reservation keeps the audit trail honest.

## Consequences

- **The bootstrap binds the reserved port.** Today this is a literal in the server-entry file; once env loading lands, the reserved value becomes the default for the relevant env variable. Either way, the reservation is the source of truth.
- **One listener carries every concern.** Fastify owns the listener; Vite's dev server runs in middleware mode against it; the React Router handler is mounted as a Fastify route. There is no second port to open, no CORS to configure, no dev proxy to maintain.
- **No "the API runs separately" assumption** is safe anywhere in the codebase — scripts, fixtures, docs, and tooling that need to reach the running app reach the single reserved address.
- **Production parity is preserved.** Prod drops Vite from the stack but keeps the same listener and the same port, so dev URLs and prod URLs differ only in scheme and host, not in shape.
- **Changing the port is an ADR-level change.** Any contributor proposing a different number has to record why the integrated stack now requires it, what the new value is, and what downstream surfaces (docs, scripts, env defaults) change with it. Routine port-conflict troubleshooting (another process holding the address) is resolved by freeing the address, not by moving the reservation.

## Related

- [ADR-0001](./0001-vite-multi-target-config.md) — the Vite multi-target config layout the single-port stack depends on (server config drives `vite-node`; client config is consumed in middleware mode by Fastify).
- [`../vite/multi-target-config.md`](../vite/multi-target-config.md) — the pattern doc that describes the integrated stack end-to-end; this ADR records the port-reservation decision that pattern rests on.
