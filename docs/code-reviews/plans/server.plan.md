# Code Review Plan: Server

## Scope

The Fastify HTTP server slice — bootstrap, the typed framework-instance alias, the route plugin tree, and server-only constants. The defining property: this is the **process boundary**. Everything here runs inside the long-lived Node process; failures here mean the server fails to start, crashes mid-request, or stays alive in a half-initialised state. Concerns include:

- Startup discipline — instance construction, plugin registration, listen, and the cleanup path on failure
- A single typed framework-instance alias that pre-stages the generic slots the rest of the slice relies on
- Route plugin organisation — one plugin per resource, prefix encapsulation, no inline handlers in the bootstrap
- Server-only constants — protocol/route primitives that only the server runtime consumes

Several adjacent slices are **deferred and forward-looking**, not absent defects. Plans that flag them as missing today regress the project's intentional posture:

- Schema tooling for route validation and response shaping (a Zod-backed type provider, an OpenAPI exporter, and a generated client SDK consuming the resulting spec) — when that slice lands, the schema-coherence checks live in this plan.
- Pino integration as the explicit logger — the typed instance alias already reserves the logger slot for the swap.
- Explicit return types on route handlers — co-arrives with the schema slice.
- Environment-variable loading — port, prefix, and timeout are hardcoded today by intent.

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
- `disableRequestLogging: true` plus a non-default logger is a deliberate pairing — the default access-log line is suppressed so the future structured logger can own request observability. Flag any change that toggles one without the other.
- No top-level `await` outside the try block — a rejection from import-time work leaves the instance unconstructed and the catch path unreachable. Top-level `await` inside the try block (registration calls, the `listen` call) is fine; the catch path catches those rejections by design.

### Typed instance alias

- The slice exposes **one** typed alias for the framework instance. Every route, plugin, and helper consuming the instance imports the alias rather than re-parameterising the generic at the call site.
- The alias pre-stages every generic slot the framework exposes: server type, incoming-message type, response type, logger type, and type-provider type. Each slot's argument is the project's chosen pairing for that slot, not the framework's default.
- The logger slot is named even when the project still uses the framework's default logger — it reserves the type position for the future logger swap so consumers don't break when the swap lands.
- Alias drift is a regression: two files declaring near-identical aliases with different slot orderings will type-check today and silently diverge at the next framework major. The single-alias rule is the guard.
- Generic-arity changes between framework majors are version-pinned, not version-floating — a major bump that adds a new generic slot is an explicit update to the alias, not an inferred one.

### Route organisation

- One route plugin per resource. Each plugin owns the routes under its prefix and is registered from the bootstrap with that prefix.
- The prefix passed at registration is the only place the resource's base URL appears — handlers reference relative paths only, so a base-URL rename touches one constant.
- No inline route handlers in the bootstrap. The bootstrap registers plugins; plugins register handlers. The boundary keeps the bootstrap diffable and the plugin loadable into tests in isolation.
- Plugins are async, even when the body is synchronous, so a future plugin that needs to `await` doesn't force a signature change.
- Each handler is a named arrow or function passed to the route method, not an inline lambda — easier to unit-test, easier to stack-trace.

### Server-only constants

- Every server constants object is frozen with `Object.freeze({...} as const)` — runtime freeze plus literal-type narrowing.
- Naming follows the protocol/concept of the constant, not the consumer. URL-namespace constants describe the URL segment they encode, not the module that registers under it.
- Constants compose: a base URL constant derives from the namespace and a per-resource prefix, the prefix is the only literal that file owns. A change to the namespace flows everywhere; per-resource files don't re-encode it.
- No env-derived values until the env-loading slice lands. A port literal, a prefix literal, and a timeout literal in the bootstrap are expected today — flag only if they leak from `app/server/constants/**` into shared, or vice versa.
- Server-only protocol constants stay under `app/server/constants/**`. A constant consumed by both the server and a client surface belongs under the shared constants tree; relocating it is a separate refactor, not a server-plan finding.

### Forward-looking — schema and logger slices

When reviewing today, treat the following as future-shipping rather than absent-defect:

- Routes return plain object literals with no response schema attached. The schema slice will add Zod-backed validation and a response shape; when it lands, this section gains a "response-schema coverage" criterion.
- The default logger is configured by setting the framework's `logger` flag to `true`. When the Pino slice lands, the logger slot in the typed instance alias is what makes that swap a one-line change in the bootstrap.
- Handler return types are inferred. Explicit return types are deferred to the schema slice, where the response type comes from the schema rather than from hand-written annotations.

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
- Lands the schema-tooling slice, the Pino slice, the explicit-return-types slice, or the env-loading slice (each landing widens the review focus accordingly)
- Touches `tsconfig.app.json` in a way that affects the server's reachable libs, types, or target

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
