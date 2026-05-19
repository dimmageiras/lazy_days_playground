# Code Review Plan: Bootstrap Module

## Scope

The **single-instance handoff** module — everything required to ensure exactly one server claims the port, with a graceful handover from a prior instance when one is already running. Concerns include:

- Installing process-level graceful-shutdown handlers (close-with-grace integration)
- Defining the cooperative-shutdown HTTP route (the _server_ side of the handoff protocol)
- Issuing the cooperative-shutdown HTTP request (the _client_ side of the same protocol)
- Discovering and signalling the port owner via OS-level mechanisms (netstat parsing, process.kill)
- Orchestrating the listen attempt with cooperative-then-force fallback and fail-fast

The module exposes a single async orchestrator function consuming the Fastify instance and the config bag; the orchestrator owns the internal sequence (install close listeners → register the shutdown route → claim the port). The server composition layer awaits it; this module owns the behaviour.

## Files currently in scope

- `app/server/modules/bootstrap/bootstrap.module.ts` (top-level orchestrator)
- `app/server/modules/bootstrap/routes/**` (the shutdown route plugin)
- `app/server/modules/bootstrap/helpers/**` (port-claim orchestration, close listeners, listen retries, port-owner discovery/kill, cooperative shutdown request, helper barrel)
- `app/server/modules/bootstrap/constants/**` (module-scoped timing and signal constants)
- `app/server/modules/bootstrap/types/**` (the orchestrator's config shape and helper result types)

## Required skills

| Skill                           | Why                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality`       | Multi-axis baseline                                                                                                                               |
| `fastify-best-practices`        | The shutdown route is a Fastify plugin; plugin lifecycle, hooks, and reply handling apply                                                         |
| `node`                          | Heavy use of `node:child_process`, `node:crypto`, `node:buffer`, signal handling, `process.kill`, top-level await; Node 24 type-stripping caveats |
| `typescript-magician`           | Factory pattern with closure-captured options, `as const` tuples, plugin generic types, type-only imports for CJS deps                            |
| `improve-codebase-architecture` | This is the project's largest cohesive module; module boundaries, helper layering, and factory shape matter                                       |

## Review focus

### Correctness — handoff protocol

- The shutdown route only accepts requests from loopback addresses (IPv4 + IPv6); reject otherwise with a non-revealing status
- Token comparison is **constant-time** (`crypto.timingSafeEqual` over equal-length buffers); rejects non-string headers; same status returned regardless of which check failed
- The graceful shutdown is triggered **after** the response has finished writing, not before — otherwise the client never sees the 202

### Correctness — port claim flow

- The orchestrator's branches are exhaustive: try-listen → cooperative-then-wait → force-kill-then-wait → fail-fast
- Each wait has a bounded timeout; no infinite loop possible
- The cooperative-request timeout is shorter than the wait window (so we don't wait beyond the protocol's own deadline)
- Logs at each branch state what's happening so an operator can read the flow

### Race conditions and Windows quirks

- Two consecutive port-availability checks against the same port don't collide on socket release (the listen-then-fail pattern handles this; an isolated availability probe does not)
- Signal mapping on Windows is documented in the comments or implicit in code (SIGTERM is delivered as immediate kill on Windows; the cooperative HTTP route is the cross-platform path)

### Security

- Token check is timing-safe (Aikido-style timing-attack vulnerability is the canonical foot-gun here)
- IP allowlist comparison uses configured loopback identifiers; not hardcoded literals in handler logic
- The shutdown token's source is treated as a secret in code paths that log it (no token leakage in error messages)
- `process.kill` only ever targets a PID that the module itself discovered via the netstat parser — no PID accepted from external input

### Fastify idioms

- The route is exported as a `FastifyPluginAsync<Options>` so the host app can register it with options
- `reply.raw.on("finish")` is used (not a higher-level Fastify hook) because we need the "single response finished" event; this should be flagged as deliberate
- Plugin options are typed and consumed via destructure, not via `app.decorate` side channels

### Node idioms

- `node:` prefix used for all built-in imports (`node:child_process`, `node:crypto`, `node:buffer`)
- `Buffer` is imported when used (not relying on the global)
- `process.kill` and signal types are imported as type-only where they're types (Signals union from close-with-grace)
- Child process error event handlers `resolve(null)` rather than throwing — caller gets a clean false signal

### TypeScript discipline

- The orchestrator's config bag is the single channel for env-varying values; helpers downstream do not require the caller to thread the same values back
- Config interface stays minimal — values that aren't env-varying are direct-imported at the helper layer, not routed through the bag
- No `any`; type assertions are limited to known-narrow casts (e.g. casting `error` to `NodeJS.ErrnoException` after a code check)

### Architecture

- Helpers each carry one concern (close listeners, listen retries, port-owner discovery/kill, cooperative shutdown request, port-claim orchestration); the barrel exists for ergonomic re-export, not to hide responsibilities
- The route lives in `routes/`, not `helpers/`, because it produces a Fastify plugin
- Cooperative shutdown is offered as a _protocol_ — server side in `routes/`, client side in `helpers/` — and the two share their config shape (request config extends route config)
- The module's top-level orchestrator wires close listeners → shutdown route registration → port-claim in order; it does not own branching logic — branch escalation (try → cooperative → force → fail-fast) belongs inside the port-claim helper

### Logging

- Warnings appear at every meaningful branch transition (port in use, cooperative failed, sending SIGTERM, etc.)
- Errors are logged with the actual error object, not just a message
- The "another instance started" log fires only when shutdown was triggered via the cooperative route (`manual: true` from close-with-grace), not on signal

### Edge cases

- The cooperative request gracefully handles: connection refused, timeout, non-2xx response, malformed response. All map to "failed; fall back to force".
- The kill helper handles: PID not found, kill throws, process already dead. All return false rather than throwing.
- The listen helper distinguishes `EADDRINUSE` from other errors (re-throws the rest).

## When to run this plan

A PR that touches:

- The shutdown route, route handler, or its token/IP check
- The orchestrator's composition shape, its return type, or how it threads options through to the route
- Any helper under the bootstrap module
- Module-scoped constants (timing values, signal lists)
- The cooperative-shutdown protocol contract (path, token header name, request shape)

Even small changes here have outsized impact — this module decides whether two `pnpm dev` invocations cleanly hand off or stomp on each other.

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post inline findings via the `gh api … reviews` call (see the code-review project rule).
