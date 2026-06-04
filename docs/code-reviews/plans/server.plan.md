# Code Review Plan: Server

## Scope

The Fastify HTTP server slice — bootstrap, the typed framework-instance alias, the route plugin tree, and server-only constants. The defining property: this is the **process boundary**. Everything here runs inside the long-lived Node process; failures here mean the server fails to start, crashes mid-request, or stays alive in a half-initialised state. Concerns include:

- Startup discipline — instance construction, plugin registration, listen, and the cleanup path on failure
- A single typed framework-instance alias that pre-stages the generic slots the rest of the slice relies on
- Route plugin organisation — one plugin per resource, prefix encapsulation, no inline handlers in the bootstrap
- Server-only constants — protocol/route primitives that only the server runtime consumes

The bootstrap validates required environment variables against a schema before constructing the instance, and the values it consumes (the listen port, the service identity) flow from environment variables rather than from literals. Other values (the route prefix, the request timeout) are literal/constant-sourced — expected today, not defects.

Routes return plain object literals with no response schema attached, and the framework's default logger is configured by setting the `logger` flag to `true`. The typed instance alias names the logger slot so a logger swap stays a one-line change. Handler return types are inferred. None of these are absent-defect findings.

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement.

- `app/server/start.ts` (process entrypoint — instance construction, plugin registration, `listen`, and the `try`/`catch`/`close`/`exit` flow)
- `app/server/types/instance.type.ts` (the typed framework-instance alias)
- `app/server/routes/**/*.route.ts` (route plugins, one per resource, registered with a prefix from the URL constants)
- `app/server/constants/**` (server-only protocol/route primitives — base URLs, endpoints, namespaces, service identity)
- `tsconfig.app.json` (the `lib`/`target`/`types` choices that govern what the server code can reach into)

## Required skills

| Skill                     | Why                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                                                                             |
| `fastify-best-practices`  | Plugin lifecycle, encapsulation, registration order, `ready`/`listen` semantics, error-event vs throw discipline, request/reply contract        |
| `node`                    | Top-level await semantics, process-exit codes, signal handling, active-handle teardown, async-iterator close, `node:http` types under stripping |
| `typescript-magician`     | The framework-instance alias is a generic-tuple type — alias drift, generic-arity changes between framework majors, and the cost of widening    |

## Review focus

### Bootstrap discipline

- Instance is constructed first, plugin registrations follow, `listen` runs last. No business logic, no `await` on side-effecting work outside the try block.
- The try block wraps **every** registration and the listen call together — partial success (registrations completed, listen failed) must still flow through the same cleanup path.
- The catch block logs the error through the instance logger, awaits `close()` to release active handles, then exits with a non-zero code. Returning from the bootstrap on error without `process.exit` leaves the worker alive with no listener, which CI/orchestrators interpret as healthy.
- The exit code is non-zero (`1` is fine) — `0` on a caught error masks the failure to any supervisor.
- `disableRequestLogging: true` plus the configured logger is a deliberate pairing — the default access-log line is suppressed so the logger owns request observability. Flag any change that toggles one without the other.
- No top-level `await` outside the try block — a rejection from import-time work leaves the instance unconstructed and the catch path unreachable. Top-level `await` inside the try block (registration calls, the `listen` call) is fine; the catch path catches those rejections by design.

### Typed instance alias

- The slice exposes **one** typed alias for the framework instance. Every route, plugin, and helper consuming the instance imports the alias rather than re-parameterising the generic at the call site.
- The alias pre-stages every generic slot the framework exposes: server type, incoming-message type, response type, logger type, and type-provider type. Each slot's argument is the project's chosen pairing for that slot, not the framework's default.
- The logger slot is named even though the project uses the framework's default logger — it holds the type position so a logger swap doesn't break consumers.
- Alias drift is a regression: two files declaring near-identical aliases with different slot orderings will type-check today and silently diverge at the next framework major. The single-alias rule is the guard.
- Generic-arity changes between framework majors are version-pinned, not version-floating — a major bump that adds a new generic slot is an explicit update to the alias, not an inferred one.

### Route organisation

- One route plugin per resource. Each plugin owns the routes under its prefix and is registered from the bootstrap with that prefix.
- The prefix passed at registration is the only place the resource's base URL appears — handlers reference relative paths only, so a base-URL rename touches one constant.
- No inline route handlers in the bootstrap. The bootstrap registers plugins; plugins register handlers. The boundary keeps the bootstrap diffable and the plugin loadable into tests in isolation.
- Plugins are async, even when the body is synchronous, so a plugin that needs to `await` doesn't force a signature change.
- Each handler is a named arrow or function passed to the route method, not an inline lambda — easier to unit-test, easier to stack-trace.

### Server-only constants

- Every server constants object is frozen with `Object.freeze({...} as const)` — runtime freeze plus literal-type narrowing.
- Naming follows the protocol/concept of the constant, not the consumer. URL-namespace constants describe the URL segment they encode, not the module that registers under it.
- Constants compose: a base URL constant derives from the namespace and a per-resource prefix, the prefix is the only literal that file owns. A change to the namespace flows everywhere; per-resource files don't re-encode it.
- Environment-derived values do not belong in `app/server/constants/**`. Values that vary per environment (the listen port, the service identity) flow from the validated environment layer, not from a frozen constants object. A literal in the bootstrap that is not environment-derived (the route prefix, the request timeout) is expected — flag only if such a literal leaks from `app/server/constants/**` into shared, or vice versa.
- Server-only protocol constants stay under `app/server/constants/**`. A constant consumed by both the server and a client surface belongs under the shared constants tree; relocating it is a separate refactor, not a server-plan finding.

### Environment-variable validation

The bootstrap validates required environment variables against a schema and aborts the process if validation fails, before any instance construction.

- Validation runs **first** — before the framework instance is constructed — and a validation failure exits the process with a non-zero code rather than letting the server start in a half-configured state.
- The validation failure path reports every offending variable, not just the first, so a contributor fixing a fresh checkout sees the full set in one run.
- Environment values the bootstrap consumes (the listen port, the service identity) are read from the validated environment surface, not re-declared as literals. A port or service-name literal in the bootstrap is a regression.
- The schema and its parsing wrapper live outside the server-only tree (a value-validation concern shared with other surfaces). The schema/wrapper layer and the validation invocation itself are **delegated to** [`./validation.plan.md`](./validation.plan.md) — whether the schema's conventions, the branded outputs, the issue-code vocabulary, and the failure formatting are correct is that plan's concern. This plan covers only the bootstrap-side discipline: that validation runs first, fails the process, and that the values it consumes flow from the validated surface rather than from re-read literals. Surface validation-internal observations under Out of scope; a PR touching both runs both plans.

### TypeScript discipline

- The framework-instance alias is the only place generic slots are spelled out. Routes and plugins reach for the alias and let the inferred parameter shape narrow the rest.
- The slice does not introduce `any` to widen a generic mismatch. A mismatch is either the alias drifting (fix the alias) or the framework major-bumping (update the alias as a deliberate change).
- Types-only imports use `import type`, value imports use the standard form — the separation survives `verbatimModuleSyntax` cleanly.

### Codebase-agnostic naming

- Constant group names describe the concept (URL namespaces, base URLs, endpoints, service identity), not the consumer module. The rename test (see [`CONTEXT.md`](../../../CONTEXT.md#rename-test)) applies — a file whose name encodes its current caller will rot when the caller moves.

## When to run this plan

A PR that:

- Adds or modifies the server bootstrap, the typed instance alias, or any route plugin under `app/server/routes/**`
- Adds, renames, or restructures any file under `app/server/constants/**`
- Changes the framework major version or its type packages
- Adds route response schemas, swaps the logger, or adds explicit handler return types (each widens the review focus accordingly)
- Changes the bootstrap's environment-variable validation, or moves a bootstrap literal (the route prefix, the request timeout) into the validated environment surface
- Touches `tsconfig.app.json` in a way that affects the server's reachable libs, types, or target

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
