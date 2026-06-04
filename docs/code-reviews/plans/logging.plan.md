# Code Review Plan: Logging

## Scope

The server's **logging capability** — the module that builds the application logger from the validated environment, the typed logger surface that capability exposes, and the conventions every call site follows when it logs. The defining property: this is the **observability boundary**. Everything here decides what a running process reveals about itself — what is recorded, at what severity, with what structure, and whether a final line survives process exit. Concerns include:

- The logger module — a factory that builds the logger from injected, validated environment values (level, service identity, development flag), with transport/format selected by environment rather than read at import time
- Transport and format selection — human-readable in development, structured JSON otherwise — and the typed transport configuration that drives it
- The typed logger surface — the logger generic the framework instance is parameterised with, including the library extras the codebase relies on (flush, level introspection)
- Call-site conventions — the level vocabulary, the structured-object-plus-message shape, error normalization, message phrasing by call site, the per-request logger, the never-log-secrets rule, and flush-before-exit

The values the logger consumes (the log level, the development flag, the service identity) flow from validated environment variables, not from literals. The **shape** of those conventions is canonical; the canonical statement of the conventions themselves lives in the logging conventions doc, and this plan checks adherence to it.

The logger is a **module** (see the **Module** term in [`CONTEXT.md`](../../../CONTEXT.md)): it owns the logging capability and its internals (transport constant, options builder, types) behind a curated surface. The composition layer wires the built logger in without depending on those internals.

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement.

- `app/server/modules/pino-logger/**` (the logger module — its public factory, the internal options builder, the transport constant, its types, and their specs)
- `app/server/app.ts` (where the built logger is wired as the framework's logger instance, the request-logging toggle is paired with it, and failures are logged with structured context)
- `app/server/start.ts` (composition-layer logging at startup/shutdown — level choice, structured shape, and flush-before-exit; the surrounding control flow is the server plan's concern)
- `app/server/types/instance.type.ts` (the logger generic slot the instance alias names — specifically the library-extras intersection the logging code relies on; the alias as a whole is the server plan's concern)
- `docs/logging/README.md` (the canonical conventions this plan checks adherence to)

## Required skills

| Skill                     | Why                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `code-review-and-quality` | Multi-axis baseline                                                                                                                              |
| `fastify-best-practices`  | Logger-instance integration, the request-logging toggle, per-request child logger, redaction, custom serializers, the framework's Pino lifecycle |
| `node`                    | Transport runs on a worker thread; `process.exit` races the async flush; stdout/stderr write semantics and active-handle teardown                |
| `typescript-magician`     | The library-extras intersection on the logger slot; the branded log-level output staying assignable to the logger's level type                   |

The log level and development-flag **schema** (their validation, branding, and parse contract) are **delegated to** [`./validation.plan.md`](./validation.plan.md) — invoke `zod` there, not here. This plan covers how those validated values are _consumed_ by the logger, not how they are validated.

## Review focus

### The logger module

- The logger is built by a **factory that takes the validated environment**, not a module-level singleton constructed at import. No environment value is read at import time — the factory receives it.
- The factory's public surface is a frozen namespace; the option-assembly logic is a pure, separately-testable internal helper (it returns a plain options object, so it can be asserted without spawning a transport worker thread).
- Level, service identity, and the development flag are read from the passed environment, never re-derived from a literal or a second source.
- The service identity is carried as a base field on every line.

### Transport and format selection

- Human-readable transport in development; structured JSON (no transport) otherwise. The selection is driven by the development flag from the environment, not by an ad-hoc check.
- The transport configuration is a frozen, typed constant checked against the library's transport type — not an inline object literal at the construction site.
- A transport target that is referenced only as a string (the pretty-printer) is invisible to the unused-dependency checker; it must be declared as an ignored dependency rather than dropped. Flag a PR that removes that ignore while the string reference remains, or vice versa.

### The typed logger surface

- The framework-instance alias names the logger slot with the library-extras intersection, so the per-instance logger exposes the library's own methods (level introspection, flush) and not only the framework's base contract.
- The factory's return type matches that slot — the built value must be assignable where the instance alias expects it, so the construction site type-checks without widening or casting.
- The branded log-level output stays assignable to the logger's level type. A brand that makes the level unassignable to the logger is a regression, not a tightening.

### Call-site conventions

Adherence to [`docs/logging/README.md`](../../../docs/logging/README.md):

- **Levels by intent.** `info` is for startup, configuration, and graceful-shutdown transitions — never for a successful request or operation. `fatal` is for a failure immediately followed by process termination; `error` is for a failure that aborted the operation but not the process.
- **Structured shape.** Error and warning calls pass a context object first (`error` message and `stack` spelled out, plus relevant fields) and a human-readable message second. A bare `logger.error(err)` that passes the raw error as the whole payload is a finding.
- **Error normalization.** A caught value is normalized to an `Error` before `.message` / `.stack` are read.
- **Message phrasing by call site.** Operation-style inside a handler, "Failed to …" around lifecycle wiring, subject-noun for hooks and the global handler. The emoji prefix vocabulary is consistent.
- **Per-request logger.** Inside a request, logging goes through the per-request logger (which carries the request id) rather than the root logger; outside a request, the root logger is correct.

### Flush before exit

- Any path that logs and then exits the process flushes the logger and exits from the flush callback — a synchronous `process.exit` after a `fatal` line can terminate before the worker-thread transport writes it. The logger surface exposes the flush method for exactly this; a fatal-then-`exit` path with no flush is a finding.

### Secrets and redaction

- Passwords, tokens, API keys, and full card numbers never reach a log line. The guard is structural — redaction paths configured on the logger — not per-call-site vigilance. A module that reads a sensitive field contributes its own redaction paths so the composition layer stays unaware of which fields are sensitive.

### Wiring

- The built logger is supplied as the framework's logger instance, and the default access-log toggle is set deliberately in concert with it — the framework's own request logging is either owned by the configured logger or suppressed on purpose, never toggled by accident. Flag a change that flips one without the other.
- The environment is mapped to its domain shape once and reused for both the logger construction and the instance decoration, not rebuilt per consumer.

### Codebase-agnostic naming

- The module and its internals are named for the capability (the logger, its transport, its options), not for a consumer. The rename test (see [`CONTEXT.md`](../../../CONTEXT.md#rename-test)) applies.

## When to run this plan

A PR that:

- Adds or modifies the logger module — the factory, the options builder, the transport constant, or its types
- Changes how the logger is wired into the framework instance, or flips the request-logging toggle
- Changes the logger generic slot on the instance alias or the factory's return type
- Adds, removes, or restructures logging call sites, or changes a log level, message, or structured-field set
- Adds redaction paths, custom serializers, or a request-id strategy
- Touches a process-exit path that logs before exiting (the flush-before-exit invariant)
- Edits the logging conventions doc (also run the documentation plan)

## Delegations

- **Log-level / development-flag schema and validation** → [`./validation.plan.md`](./validation.plan.md). This plan consumes the validated values; that plan owns their schema, branding, and parse contract.
- **Bootstrap control flow** (construction order, the `try`/`catch`/`close`/`exit` path) → [`./server.plan.md`](./server.plan.md). This plan covers only the logging discipline within that flow.
- **Specs for the logger module** → [`./testing.plan.md`](./testing.plan.md) for spec-author conventions; this plan covers what the logging behaviour under test should be.

Surface cross-area observations under the finding's Out of scope section; a PR touching multiple areas runs each plan.

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).

## Related

- [`../../../CONTEXT.md`](../../../CONTEXT.md) — the **Module** term the logger is an instance of
- [`../../adr/0009-bootstrap-environment-validation.md`](../../adr/0009-bootstrap-environment-validation.md) — the startup gate that produces the validated environment the logger is built from
- [`../../logging/README.md`](../../logging/README.md) — the canonical logging conventions this plan checks adherence to
- [`./server.plan.md`](./server.plan.md), [`./validation.plan.md`](./validation.plan.md), [`./testing.plan.md`](./testing.plan.md) — the sister plans this one delegates to
