# 0003. Single listener on a reserved port

- **Status:** Proposed
- **Date:** 2026-05-26

## Context

The runtime is a single Node process that exposes the project's HTTP surface through one listener: a Fastify server. The listen port is configuration — it varies between a contributor's checkout and any other instance — and the question is whether that value is an arbitrary, freely-movable number or a deliberate reservation worth recording.

A naive reading of the port number leads to two wrong conclusions: that it can be moved freely with no consequence, or that it collides with the default port of a tool that happens to use the same number (a browser-facing dev server's conventional default) and should be moved to "fix" the collision. The project owns the address deliberately rather than treating it as incidental.

## Decision

The project reserves a **single port** for its listener. The reserved value is **`5173`**.

The listen port is supplied through a required environment variable; there is no in-code default, so a checkout provides the reserved value through its environment file. The startup environment-validation gate (ADR-0009) runs ahead of binding, so the process refuses to start when the port variable is absent or malformed. The reservation is the decision; the literal value is the reserved instance. Changing the literal — for any reason, including a perceived collision with a tool default — requires a new ADR.

## Alternatives considered

### A different port number to avoid a perceived "tool default" collision

Move the listener to a value a browser-facing dev server would not pick by default (e.g. 3000, 4000, 8080), on the assumption that overlap with such a default is a configuration smell. Rejected because picking a different number to avoid an imagined collision would make the reservation accidental rather than deliberate, and the next reader would draw the same wrong conclusion in reverse ("why isn't this on 5173?").

### No reserved value — let each environment pick a port freely

Treat the port as an ordinary configurable value with no canonical reservation, picked per environment. Rejected because a non-reserved value propagates into shell scripts, browser bookmarks, and team muscle memory. Reserving the value and recording it here keeps the address deliberate rather than incidental.

## Consequences

- **The environment gate runs before the listener binds.** Startup validates the environment first (ADR-0009); only once that gate passes does the bootstrap construct the server and bind the listen port. The port variable is required — no in-code fallback — so the reserved value is supplied through the environment file rather than baked into the bootstrap.
- **One listener carries the HTTP surface.** Fastify owns the single listener; there is one address to reach the running app.
- **No "the server runs somewhere else" assumption** is safe anywhere in the codebase — scripts, fixtures, docs, and tooling that need to reach the running app reach the single reserved address.
- **Changing the port is an ADR-level change.** Any contributor proposing a different number has to record why, what the new value is, and what downstream surfaces (docs, scripts, env files) change with it. Routine port-conflict troubleshooting (another process holding the address) is resolved by freeing the address, not by moving the reservation.

## Related

- [ADR-0001](./0001-vite-multi-target-config.md) — the Vite multi-target config layout whose server config drives the `vite-node` dev runner this listener starts under.
- [ADR-0009](./0009-bootstrap-environment-validation.md) — the startup environment-validation gate that runs before the listener binds the reserved port.
