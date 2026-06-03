# 0003. Single-port integrated stack

- **Status:** Proposed
- **Date:** 2026-05-26

## Context

The target runtime is a single Node process that hosts three concerns at once: the Fastify API, the React Router framework-mode SSR handler, and (in development) Vite's dev server mounted as middleware. The pattern is documented in detail in the multi-target Vite pattern doc; this ADR records the **port-reservation decision** that pattern depends on.

A single-process integrated stack means there is exactly one listener — one port — exposing every concern the project ships. That single port has to absorb three roles simultaneously: the API surface, the SSR HTML response, and the dev-time Vite asset / HMR traffic the SSR HTML references. A naive reading of the port number could lead a future contributor to two wrong conclusions: that it is an arbitrary value that can be moved freely, or that it collides with the default port of a tool that happens to use the same number (Vite's dev-server default) and should be moved to "fix" the collision. Both readings would break the integrated stack, the second one more subtly than the first — the value is deliberately chosen to match the default a browser-facing dev tool (Vite, in this stack) would otherwise bind to, so the project owns the address up-front rather than letting two tools fight over it later.

The Fastify API is the first concern of the integrated stack to land; the React Router SSR handler and the dev-time Vite middleware join it when the client runtime lands. The listen port is configuration — it varies between a contributor's checkout and any deployed instance — and is now supplied through a required environment variable validated at startup (ADR-0009), rather than a literal at the server bootstrap. Recording the reservation here gives that value an audit-trail anchor independent of where it is currently read.

## Decision

The project reserves a **single port** for the integrated stack — Fastify + React Router SSR + Vite middleware in development, Fastify + React Router SSR (no Vite) in production. The reserved value is **`5173`**.

The listen port is supplied through a required environment variable; there is no in-code default, so a checkout provides the reserved value through its environment file. The startup environment-validation gate (ADR-0009) runs ahead of binding, so the process refuses to start when the port variable is absent or malformed. The reservation is the decision; the literal value is the reserved instance. Changing the literal — for any reason, including a perceived collision with a tool default — requires a new ADR.

## Alternatives considered

### Two ports — one for the API, one for the client dev server

The classic split: Fastify on one port, Vite (or the React Router dev server) on another, with CORS or a dev proxy bridging them. Rejected because the integrated-stack pattern this project commits to is a single Node process serving every concern through one listener — splitting ports re-introduces the cross-origin, cross-process coordination the single-process design exists to avoid, and the production runtime would still collapse to one port, leaving the dev/prod parity worse than before.

### A different port number to avoid the "Vite default" collision

Move the listener to something Vite would not pick by default (e.g. 3000, 4000, 8080), on the assumption that overlap with the dev-server default is a configuration smell. Rejected because there is no collision — Vite does not bind a port in this project's dev flow; Vite is mounted as middleware on the Fastify listener and does not open its own server. Picking a different number specifically to avoid an imagined collision would make the reservation accidental rather than deliberate, and the next reader would draw the same wrong conclusion in reverse ("why isn't this on 5173?").

### No reserved value — let each environment pick a port freely

Treat the port as an ordinary configurable value with no canonical reservation, picked per environment. Rejected because a non-reserved value propagates into shell scripts, browser bookmarks, and team muscle memory, and the integrated-stack pattern is already in force in code. Reserving the value and recording it here keeps the address deliberate rather than incidental.

## Consequences

- **The environment gate runs before the listener binds.** Startup validates the environment first (ADR-0009); only once that gate passes does the bootstrap construct the server and bind the listen port. The port variable is required — no in-code fallback — so the reserved value is supplied through the environment file rather than baked into the bootstrap.
- **One listener carries every concern.** Fastify owns the listener; once the client runtime lands, Vite's dev server runs in middleware mode against it and the React Router handler is mounted as a Fastify route. There is no second port to open, no CORS to configure, no dev proxy to maintain.
- **No "the API runs separately" assumption** is safe anywhere in the codebase — scripts, fixtures, docs, and tooling that need to reach the running app reach the single reserved address.
- **Production parity is preserved.** Prod drops Vite from the stack but keeps the same listener and the same port, so dev URLs and prod URLs differ only in scheme and host, not in shape.
- **Changing the port is an ADR-level change.** Any contributor proposing a different number has to record why the integrated stack now requires it, what the new value is, and what downstream surfaces (docs, scripts, env files) change with it. Routine port-conflict troubleshooting (another process holding the address) is resolved by freeing the address, not by moving the reservation.

## Related

- [ADR-0001](./0001-vite-multi-target-config.md) — the Vite multi-target config layout the single-port stack depends on (server config drives `vite-node`; client config is consumed in middleware mode by Fastify).
- [ADR-0009](./0009-bootstrap-environment-validation.md) — the startup environment-validation gate that runs before the listener binds the reserved port.
- [`../vite/multi-target-config.md`](../vite/multi-target-config.md) — the pattern doc that describes the integrated stack end-to-end; this ADR records the port-reservation decision that pattern rests on.
