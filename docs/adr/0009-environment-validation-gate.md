# 0009. Fail-fast environment validation: the `VITE_APP_` contract, branded outputs, and the startup gate

- **Status:** Accepted
- **Date:** 2026-06-16

## Context

The server runs under a bundler-injected runtime, so its configuration surface is the bundler-populated env object rather than the raw process environment. The bundler only copies a variable onto that object when its name carries a configured prefix (the default is `VITE_`, which this project does not override); the variables this server consumes are named under a `VITE_APP_` sub-prefix within it. Everything off that surface — database credentials, signing and cookie secrets, third-party keys — is read, if at all, by the tools that own those concerns straight from the process environment.

This leaves the same configuration in two shapes that must stay honest about which one each consumer holds. On the bundler surface every value is an unparsed string keyed by its prefixed name — a port is the digit string `"5173"`, a flag the word `"true"`. The rest of the application wants the opposite: parsed, range-checked values keyed by short internal names. Two further forces apply. First, once a value is parsed it is structurally indistinguishable from any same-typed primitive, so the validation guarantee evaporates the moment the value crosses an assignment. Second, many parts of the running process — the listener's port, the logger's level and service name, request handlers — depend on configuration being present and well-formed; if each validated on its own, the checks would drift, a malformed value would surface deep in a request rather than at boot, and the process could bind a port and serve traffic while misconfigured.

## Decision

A single validation schema owns the configuration contract end to end, brands its outputs nominally, and runs once as a hard gate before anything else is built. The stance has four facets.

**One prefixed contract, two honest faces.** The schema's keys are exactly the prefixed names the application means to consume, so they survive the prefix gate; secrets are deliberately left unprefixed, keeping them off the bundler surface, out of the validated contract, and out of any client bundle by construction. The ambient type for the bundler env object is declared as the schema's _input_ type — the unparsed shape, widened with an index signature so the bundler's built-in keys still type-check — making the schema the single source of truth: declaring it as the parsed output would be a lie, because the raw surface really is unbranded strings. The internal configuration type is _derived_ from the schema's validated output: the prefix is stripped, keys are camelCased, and a small projecting adapter carries only the fields the application consumes onto a frozen internal object. The schema is non-strict — unrecognised prefixed variables are dropped rather than rejected — so the contract grows one field at a time without every newly-staged variable becoming a required key.

**Branded outputs.** Every field brands its parsed output with a distinct nominal tag (one per concept — port, service name, the development flag, the log level), and the brand types are derived once from the schema's inferred output and exported from a single place. Branding makes "this came from the schema" load-bearing in the type system rather than a convention a reviewer must remember: a plain literal of the underlying primitive does not satisfy the branded type, so to obtain a validated value you must route it through the schema. Uniform branding — not just the highest-risk field — keeps the rule predictable: a reader can trust any validated value by its type.

**A fail-fast gate, before any instance exists.** Bootstrap validates the entire environment as its very first step, before any web-framework instance, logger instance, or network listener is constructed. The order is fixed: **validate, then build, then listen.** On success the validated, branded record is the only configuration the rest of startup sees; on _any_ failure the process reports the problem through a minimal fallback logger and exits non-zero. The app is never built and the port is never bound with bad configuration. There is exactly one read of the raw input, at the gate; everything after it trusts the result and never re-reads the raw source or re-validates.

**Safe parse at the schema, named throw at the helper, report-all on failure.** The schema uses the non-throwing parse, so a validation failure is a value to branch on, not an exception — keeping the schema reusable as a pure validator elsewhere. The validation helper is the only place that turns a failure into a thrown error, and it raises a _named_ error (a plain `Error` whose `name` is a known constant), which the bootstrap path detects with a name-based type guard rather than an `instanceof` check on a bespoke subclass. The failure path formats the complete set of offending variables, one line per problem, so a single boot surfaces every misconfiguration at once.

## Alternatives considered

- **Read the raw process environment directly.** Rejected: the runtime injects configuration through the bundler surface, not the raw process environment; reading it directly bypasses the prefix gate and re-exposes every secret to code that should not see it.
- **One symmetric type for both ends.** Rejected: a single type cannot honestly describe both a digit string and a parsed integer — whichever end it matched, the other would be mistyped.
- **Hand-maintain the ambient declaration separately from the schema.** Rejected: two sources of truth drift; deriving the ambient type from the schema's input keeps them in lock-step.
- **Validate raw but leave secrets prefixed and just avoid reading them.** Rejected: prefixing a secret pushes it onto the bundler surface and risks it reaching a client bundle; the unprefixed convention makes secret exclusion structural, not a habit reviewers enforce.
- **Strict schema that rejects unknown prefixed variables.** Rejected: it forces every prefixed variable, including ones staged ahead of their consumer, to be a declared key — turning incremental rollout into a wall of validation errors.
- **Plain inferred output types, no brand.** Rejected: a validated value would be assignment-compatible with every same-typed literal, so an unvalidated primitive could silently take its place and the parse guarantee would be lost at the first hand-off.
- **A runtime guard or assertion at each consumer.** Rejected: it duplicates the validation the gate already did, runs on every call, and still cannot stop a wrong-but-well-shaped primitive from passing.
- **Brand only the highest-risk field and leave the rest raw.** Rejected: it makes the guarantee selective and the rule hard to remember; uniform branding is one predictable contract.
- **Hand-write the brand tags in a standalone types file.** Rejected: the tags drift from the schema as fields are added or renamed; deriving them once keeps producer and type contract in lockstep.
- **Validate lazily, where each value is first used.** Rejected: checks drift and duplicate, a bad value surfaces mid-request, and the process can start listening while misconfigured — the opposite of one early authoritative check.
- **Build the framework instance first, then validate using its logger.** Rejected: it inverts the dependency, since the logger's own level and service name come from the configuration being validated, and it lets an instance (and possibly a listener) exist before configuration is proven. The fallback logger exists precisely so the gate can report failure before the real instance is born.
- **Throw from inside the schema (strict parse) and catch at the boundary.** Rejected: it erases the schema-describes-shape / helper-decides-control-flow split, and forfeits reusing the schema as a non-throwing validator.
- **Stop at the first invalid variable.** Rejected: it forces operators into a fix-one-restart-discover-the-next loop; reporting every issue per boot is strictly more useful and costs nothing once the parser has collected the issues.
- **Throw a custom error subclass and guard with `instanceof`.** Rejected: a named plain error plus a name-based guard avoids subclass and cross-realm `instanceof` fragility while still distinguishing a validation failure from an unexpected one.

## Consequences

**Positive.**

- One source of truth, two honest faces: the schema defines the contract once, and both the ambient input type and the derived output type flow from it, so they cannot drift apart.
- Secrets are excluded by construction — only prefixed variables cross the gate, so no secret enters the validated contract or a client bundle — enforced by the prefix mechanism, not reviewer vigilance.
- A compile-time guarantee that a value typed as validated environment was actually produced by the schema; unvalidated input cannot reach a consumer that asks for the branded type, and brands update automatically when a field is added or renamed.
- A misconfigured process fails fast and loud at boot, never binding a port or serving traffic with bad configuration; one early read makes configuration a settled, branded fact downstream and removes a whole class of "is this present and well-formed?" guards.
- Boot failures are actionable: every offending variable is reported in one run, and the non-throwing-schema / throwing-helper split keeps exception flow in one named, greppable location.
- A non-strict schema plus a projecting adapter lets configuration land field by field, including variables staged before their consumer exists.

**Accepted negative.**

- The prefix gate is coarser than the schema: the bundler exposes _every_ prefixed variable, so an unvalidated-but-prefixed one still lands on the surface reachable through the index signature, with no schema guarantees. Consumers must go through the derived contract, never raw keys.
- A prefixing mistake is a security-relevant mistake: accidentally prefixing a secret would expose it. The scheme's safety rests on naming discipline the contract cannot itself enforce.
- Coupling to the bundler-injected surface: moving off that runtime would require re-pointing the source and re-deriving the ambient type.
- Branding has ergonomic friction and is viral: you cannot fabricate a validated value for a fixture or default — you must run the parse or use the project's single sanctioned cast — and removing a brand relaxes every downstream signature at once. The guarantee is also producer-side only: a consumer that widens its parameter back to the raw primitive forfeits the protection for that call.
- The gate reports failures through a minimal fallback logger, since the real logging instance does not exist yet, so the failure message is less rich than a fully configured log line.
- The fixed ordering is a contract held by discipline: anything that must run before the listener slots in after the gate and before build/listen, and any future code that reaches for the raw environment instead of the validated record silently breaks the single-source-of-truth guarantee.
- Validation is all-or-nothing at boot: there is no partial or deferred mode for an optional-but-late value, so every consumed variable participates in the gate.

## Related

- [`./0001-vite-multi-target-and-dev-runtime.md`](./0001-vite-multi-target-and-dev-runtime.md) — the dev runtime whose bundler-injected env object is the raw input read once at this gate.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — the project-owned validation wrapper that builds the schema, supplies its input/output and branding type helpers, and owns the issue-code formatting behind the report-all-issues message.
- [`./0010-logging-and-error-handling.md`](./0010-logging-and-error-handling.md) — the fallback logger this gate reports failure through before the real instance exists, the branded log-level output's meeting with the logger's level concern, and the error normalization the failure path uses.
- [`./0011-single-port-server-lifecycle.md`](./0011-single-port-server-lifecycle.md) — the build/listen steps that run only after this gate passes; owns the readiness boundary the validated record feeds.
- [`./0012-lint-stance.md`](./0012-lint-stance.md) — the assertion ban and single sanctioned cast governing the rare escape hatch for minting a branded value without parsing.
- [`./0004-pnpm-dependency-stance.md`](./0004-pnpm-dependency-stance.md) — the install-time fail-fast and visibility discipline this startup gate complements at a different layer.
- [`../../CONTEXT.md`](../../CONTEXT.md) — domain glossary, including **Load-bearing decision** and the **Rename test**.
- [`../../.claude/rules/state-management.md`](../../.claude/rules/state-management.md) — the client/server state lanes; environment input is a composition-layer concern, distinct from either lane.
