# 0003. Single-port integrated stack

- **Status:** Proposed
- **Date:** 2026-06-04

## Context

The target runtime is a single Node process that hosts three concerns at once: the Fastify API, the React Router framework-mode SSR handler, and (in development) Vite's dev server mounted as middleware. The pattern is documented in detail in the multi-target Vite pattern doc; this ADR records the **single-listener decision** that pattern depends on.

A single-process integrated stack means there is exactly one listener — one port — exposing every concern the project ships: the API surface, the SSR HTML response, and the dev-time asset / HMR traffic that SSR HTML references. In development, Vite runs in middleware mode against that one listener; it does not open a server or bind a port of its own. There is no second process, and no port for two tools to contend over.

The listen port is configuration — it varies between a contributor's checkout and any deployed instance — and is supplied through a required environment variable validated at startup (ADR-0009), with no in-code default. What is load-bearing is the _shape_: exactly one listener, carrying every concern, in every environment. The specific number bound is not.

## Decision

The project runs the integrated stack — Fastify + React Router SSR + Vite middleware in development, Fastify + React Router SSR (no Vite) in production — behind **exactly one listener**.

The listen port is ordinary configuration: supplied through a required environment variable, with no in-code default and no canonical value reserved in the codebase or its documentation. The startup environment-validation gate (ADR-0009) runs ahead of binding, so the process refuses to start when the port variable is absent or malformed. Each checkout and each deployed instance supplies whatever port it binds through its environment; documentation and examples refer to the port through its variable, never a literal.

## Alternatives considered

### Two ports — one for the API, one for the client dev server

The classic split: Fastify on one port, Vite (or the React Router dev server) on another, with CORS or a dev proxy bridging them. Rejected because the integrated-stack pattern this project commits to is a single Node process serving every concern through one listener — splitting ports re-introduces the cross-origin, cross-process coordination the single-process design exists to avoid, and the production runtime would still collapse to one port, leaving dev/prod parity worse than before.

### Reserve a specific canonical port value

Pin one port number as the project's reserved value and record it as a decision. Rejected because the value is functionally arbitrary — nothing in the stack binds a port of its own (Vite runs as middleware on the single listener), and the port is already supplied and validated through the environment. Pinning a literal in code or documentation adds a value that rots on the first environment that differs and invites cargo-cult reasoning ("why this number, and is it safe to change?"). The commitment is to one listener; the number is left to configuration.

## Consequences

- **The environment gate runs before the listener binds.** Startup validates the environment first (ADR-0009); only once that gate passes does the bootstrap construct the server and bind the listen port. The port variable is required — no in-code fallback — so the value is supplied through the environment rather than baked into the bootstrap.
- **One listener carries every concern.** Fastify owns the listener; once the client runtime lands, Vite's dev server runs in middleware mode against it and the React Router handler is mounted as a Fastify route. There is no second port to open, no CORS to configure, no dev proxy to maintain.
- **No "the API runs separately" assumption** is safe anywhere in the codebase — scripts, fixtures, docs, and tooling that need to reach the running app reach the single configured address.
- **Production parity is preserved.** Prod drops Vite from the stack but keeps the same single listener, so dev URLs and prod URLs differ only in scheme, host, and port value — not in shape.
- **The port is ordinary configuration.** Changing the bound port is an environment change, not an ADR change. Documentation and examples name the port through its environment variable rather than a literal, so they stay correct across every environment. What would require a new ADR is abandoning the single-listener shape itself.

## Related

- [ADR-0001](./0001-vite-multi-target-config.md) — the Vite multi-target config layout the single-port stack depends on (server config drives `vite-node`; client config is consumed in middleware mode by Fastify).
- [ADR-0009](./0009-bootstrap-environment-validation.md) — the startup environment-validation gate that runs before the listener binds the port.
- [`../vite/multi-target-config.md`](../vite/multi-target-config.md) — the pattern doc that describes the integrated stack end-to-end; this ADR records the single-listener decision that pattern rests on.
