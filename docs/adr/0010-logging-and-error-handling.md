# 0010. Logging architecture and error normalization

- **Status:** Proposed
- **Date:** 2026-06-14

## Context

The server logs through a structured logging library integrated as the application instance's logger. How that logger is built, how failures are logged before it exists, how the process exits without losing its final line, what shape a caught value takes in a log call, and what type the logger surface carries are all coupled questions — get any one wrong and a fatal line can vanish or a call site can drift.

Several forces constrain the answer:

- The logger's configuration — level, service identity, and transport/format — only exists once the environment-validation gate has produced a trusted, validated environment. The logger must not read that environment itself, or it couples to import order relative to the gate.
- Some startup failures happen *before* any configured logger can exist: environment validation itself fails, or application construction throws before an instance is built. These must still be reported as `fatal`, and the line must land before the process dies.
- The structured transport runs on a worker thread for hot-path throughput, so a synchronous `process.exit` can tear down the process before the final line flushes.
- A `catch` binding is typed `unknown`; the thrown value may be any value, not an `Error`. Reading `.message` / `.stack` off it is unsound, and naive stringification can itself throw.
- The framework's application instance is generic over its logger type, and call sites reach for library capabilities (a buffer-drain method, the level accessor) the framework's base-logger contract does not expose.

## Decision

The logging capability is a **module that exposes factory functions, never a logger instance**, paired with a shared error helper that every failure log site flows through. The unified stance has five facets.

**Build the logger from the injected validated environment.** The composition layer calls the factory and passes in the already-validated environment; the factory returns a fresh logger configured from it. No environment value is read at module load — level, service identity, and the development flag all arrive as fields of that environment. Option assembly is a **pure internal helper** that maps the environment to a plain options object; the factory only wraps that object in the library constructor. That seam is separately testable: a test asserts the chosen level, the service field, and whether a transport is attached, with no live logger and no transport worker thread. **Transport and format selection lives inside the options builder**, driven by the development flag: pretty human-readable output in development, structured JSON otherwise — decided in exactly one place, never at a call site.

**Cover the pre-instance window with a second, fallback logger.** Two failure classes occur before a configured logger can exist. The fallback logger is built with **no environment injection** (the environment may be what failed), a **hardcoded conservative level**, **no service base and no transport**, and — critically — a **synchronous destination** that writes each line inline on the calling thread. It is used in exactly two places: to report an environment-validation failure and to report an application-construction failure that occurs before an instance exists. Once the instance is built the fallback logger is never used; every later failure — including a failure to start listening, and a failure to close the instance after a startup error — is reported through the instance's own configured logger.

**Choose the exit form by the destination's write semantics, not by uniformity.** One rule governs both loggers: *wait for the write only when the write is asynchronous.* A logger whose transport runs on a worker thread flushes and exits **from the flush callback**, so the buffered final line is on disk before the process dies. A logger backed by a synchronous destination logs `fatal` and exits **directly** — the write has already landed, so a flush callback would be ceremony. The two exit forms look inconsistent side by side; the asymmetry is the correct output of the single rule applied to two destinations and must not be normalised away in either direction.

**Normalize every caught value before logging it.** A shared error helper exposes two functions. One **coerces any `unknown` to an `Error`**: an `Error` (or subclass) passes through by identity preserving its stack; anything else is wrapped in a fresh `Error` whose message is the *total, throw-free* string form of the value (defined for `null`, `undefined`, numbers, plain objects, and symbols, never throwing on the way). The other **normalizes a caught value to a flat `{ error, stack }` context object** — `error` the message string, `stack` the stack or `undefined`. Every `error`- and `fatal`-level call passes the normalized object as the **structured-context-first** argument and a human-readable message second, spreading further domain context (request id, resource id) alongside the error fields. The codebase deliberately never passes a bare `Error` as the whole payload and never uses the library's `{ err }` serializer idiom: the field names, the message/stack split, and the room to merge context belong to the call site.

**Type the logger surface as the framework-base ∩ library-extras intersection.** A single intersection type — the framework's base-logger contract intersected with the logging library's extras interface — fills the logger generic slot on the application-instance type alias, and is also the factory's return type. The intersection surfaces the buffer-drain method the worker-thread exit path calls and the level accessor the level-reporting tests read, while remaining a valid framework logger; because the built value and the slot are typed identically, the factory output drops in with no widening and no assertion. The environment-driven level is a **branded string**; the brand must stay assignable to the library's level-option type (which accepts its level literals plus any plain string), so it must reduce to a string rather than becoming fully nominal.

## Alternatives considered

### Module-level singleton built at import time

Read the environment at module load, build one instance, export it. Rejected: it reads the environment before the validation gate can vouch for the values, couples the module to import order, and binds a transport worker thread at import — making the option logic impossible to assert in isolation and the module impossible to instantiate with a test environment.

### Factory, but with option assembly inlined into the constructor call

Keep the factory but build options inline at the constructor rather than in a pure helper. Rejected: verifying the level, service field, or transport branch would require constructing a real logger and a live transport for every option test. The pure builder is what makes the mapping assertable as plain data.

### Let each call site choose pretty vs JSON

Expose a format flag or branch on the environment before logging. Rejected: it scatters the transport decision, lets two sites disagree, and reintroduces environment reads at the edges. Format is a property of the environment the logger was built from, settled once.

### One logger for the whole startup path, lazily configured

Defer building the real logger until validation passes, then use it everywhere. Rejected: the environment-validation failure happens before that logger could be configured, so the first failure class has no logger at all. A second tier is unavoidable for the pre-validation window.

### Bare `console.error` for pre-validation failures

Skip the structured logger entirely before the instance exists. Rejected: it abandons the structured-logging contract — level discipline, context-object-first shape, normalized-error context — exactly when a clean machine-readable failure record is most useful, and produces output that does not match the rest of the system's logs.

### Give the fallback logger a worker-thread transport

Keep both loggers uniform. Rejected: a worker-thread transport reintroduces the flush-before-exit race on a path whose whole job is to log once and exit. The synchronous destination is chosen precisely so the fatal line is guaranteed to land before the exit.

### Buffer pre-validation failures and replay them through the real logger

Rejected: in the cases that trigger the fallback logger the real logger never comes to exist — there is nothing to replay through. The buffer would only ever flush on the success path, where it carries nothing.

### Uniform flush-and-exit-from-callback on every path

Tempting because it "can't hurt." Rejected as misleading: on a synchronous destination the flush callback is a pointless exit indirection, and codifying it universally erases the signal that one logger genuinely needs the callback and the other genuinely does not.

### Uniform direct `process.exit` on every path

The dangerous normalisation. Dropping the flush callback from the worker-thread path makes the final `fatal` line race the worker-thread write and disappear intermittently — on exactly the catastrophic paths where it matters most. Rejected outright.

### Force every logger onto a synchronous destination

Makes uniform direct exit correct, but at the cost of putting the hot-path logger on a synchronous write to avoid a flush callback on the rare fatal path. Rejected: the worker-thread transport exists precisely so the common path does not pay synchronous write costs.

### Log the raw value and rely on the standard error serializer

Use the library's `{ err }` / error-serializer idiom. Rejected on two counts: it assumes the caught value is an `Error`, which `unknown` does not guarantee, and it cedes the structured field names to the serializer, so consumers and future redaction paths key on serializer-defined fields rather than the stable `error` / `stack` names — leaving no flat slot to merge sibling context into.

### Inline the coercion at each call site

Read `.message` / `.stack` after an inline `instanceof` check at every site. Rejected: the shape is a contract, not a convenience. Inlined, each site can drift — different field names, a forgotten non-`Error` branch, a stringify that throws on exotic values — silently changing the fields consumers depend on. Centralizing makes the shape uniform and testable in one place.

### Stringify with template-literal interpolation

Build the wrapping message via interpolation. Rejected: interpolating a `symbol` throws a `TypeError`; the explicit total string conversion is chosen so coercion of a thrown `symbol` produces a message instead of a second exception.

### Leave the logger slot at the framework's base-logger contract

Rejected: the base contract omits the buffer-drain method the exit path depends on, so that call would not typecheck, and every library-extra use would need a per-site cast — a cast on the process-exit path being the worst place to lose type checking.

### Use the logging library's full logger type directly as the slot

Rejected: the framework constrains the slot to its own base-logger shape, which the library's full type is not guaranteed to satisfy; it also couples the slot to one library's entire surface rather than the two capabilities actually needed. The intersection is the minimal type that is simultaneously a valid framework logger and a fully-surfaced library logger.

### Cast at each call site instead of typing the slot

Rejected: casts move risk from the type system to the reviewer, and the project bans free-form assertions and routes the rare sanctioned cast through one helper.

### Tighten the level brand into a fully nominal type

Rejected: the library's level option accepts plain strings and the env-driven level reaches it as a branded string; a brand that dropped the string base would no longer be assignable, breaking the env-to-factory flow.

## Consequences

**Positive**

- The logger never reads the environment, so a whole class of import-order bugs is structurally impossible, and the option-mapping logic is unit-tested as plain data with no worker thread spawned.
- Format selection is settled in one place from one flag; pretty-in-development versus structured-JSON cannot drift between call sites. The factory can be called with any fabricated environment, so cross-environment behaviour is exercisable without process-level setup.
- Startup failures are always reportable on both sides of the construction boundary, with no window where a fatal failure can only exit silently. The fallback logger has no dependency on the environment, so it cannot itself be broken by the failure it reports.
- The final `fatal` line survives on every exit path — the worker-thread path waits for its flush, the synchronous path has already written — and each path pays only the cost its destination requires. The exit rule is stated once, so the correct form for any future logger follows from its destination property.
- One uniform structured shape for every failure log: consumers, dashboards, and future redaction paths key on the stable `error` / `stack` names. Total, throw-free coercion means even an exotic thrown value yields a clean line rather than a secondary failure inside the catch.
- A single named intersection type defines what the instance logger can do: the exit path's drain call and the level reads typecheck with no cast, and changing the surface is a one-line edit rather than a sweep across call sites.

**Accepted negative**

- Callers must obtain a validated environment and pass it in — there is no zero-argument "just import the logger" convenience, and sharing one instance across the app is the composition layer's responsibility. The pure-options split is one extra indirection.
- There are two logger-construction paths to keep coherent, and the fallback one intentionally violates the conventions the main one upholds; that divergence is deliberate, not drift. Fallback lines lack the service base and configured level, so they look different from steady-state logs, and the synchronous destination's per-line throughput cost is acceptable only because the fallback emits at most one line before exiting — the boundary keeping it off the hot path is load-bearing.
- The two exit forms look inconsistent at a glance, and their correctness is coupled to a destination property set far from the exit and not visible at the call site. Changing a logger's destination silently invalidates its exit form, with no compiler or test to catch it; the discipline is convention-enforced, not type-enforced.
- The codebase diverges from the well-documented standard-serializer idiom, so a contributor must learn this project does not use it. Normalization keeps only message and stack — custom `Error` subclass fields (a `code`, a `cause` chain) are dropped unless a call site merges them in itself — and the no-bare-`Error` rule lives in code and review, not in a lint rule.
- The logger slot is coupled to the chosen library's extras interface, and the level brand cannot evolve into a fully nominal type without re-checking assignment to the level option. Both couplings are intentional: the call sites already depend on library-specific behaviour, so the type reflects it rather than hiding it behind a cast.

## Related

- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the fail-fast validation gate whose branded output the factory consumes, and one of the two failures the fallback logger reports.
- [`./0011-single-port-server-lifecycle.md`](./0011-single-port-server-lifecycle.md) — the buildApp readiness boundary that defines the pre-instance vs post-instance split governing which logger and which exit form a failure uses.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — the library-wrapper seam pattern; the logger module follows the same curated-surface-over-library discipline.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module/helper boundary the logger lives behind: the pure options builder and the error helper are internal helpers, the factory is the curated surface.
- [`./0012-lint-stance.md`](./0012-lint-stance.md) — the type-assertion ban that rules out the per-call-site cast alternative for reaching library extras.
- [`../logging/README.md`](../logging/README.md) — the canonical project logging conventions: level vocabulary, context-object-first signature, emoji prefixes, redaction discipline, and the flush-before-exit rule with its synchronous-destination exception.
- [`../code-reviews/plans/logging.plan.md`](../code-reviews/plans/logging.plan.md) — the review plan that treats a fatal-then-exit path with no flush as a finding.
- [`../../.claude/rules/invocations/logging-best-practices.md`](../../.claude/rules/invocations/logging-best-practices.md) — the rule pairing the upstream Pino reference with the project logging doc.
