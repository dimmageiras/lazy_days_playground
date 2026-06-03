# 0009. Validate the environment against a schema at startup, fail fast

- **Status:** Proposed
- **Date:** 2026-05-30

## Context

A long-lived server process reads configuration from its environment: the port it listens on, the identity it reports as, and whatever else varies between a developer's checkout and a deployed instance. The environment is untrusted input — a variable can be absent, empty, or the wrong shape (a port that isn't a number, a number out of range). How and when the process reacts to a malformed environment is a decision with consequences that reach well beyond the line that reads a variable.

Three forces are in tension. First, **timing**: a configuration error discovered after the server is listening produces a process that is alive but wrong — it accepts connections it cannot serve correctly, and an orchestrator reading the listening socket interprets it as healthy. Second, **typing**: a raw environment value is a string (or undefined); the rest of the codebase wants a validated, typed value it can trust without re-checking. Third, **diagnosability**: a contributor on a fresh checkout with several variables unset needs to see the full set of problems in one run, not fix one, re-run, discover the next, and repeat.

The reusable validation machinery — the schema library wrapper, the schemas, the issue-formatting helpers — already exists as a cross-cutting surface. The decision here is how the process boundary uses that surface to gate its own startup.

## Decision

The process validates its required environment variables against a schema as the **first** step of startup, before any server framework instance is constructed. Validation uses the non-throwing parse path; on failure the process reports the **complete** set of offending variables through the shared issue-formatter and exits with a non-zero code. The startup gate's job is to refuse to proceed past that first step unless the environment satisfies the schema.

The schema defines **branded outputs** for each validated variable — the typed contract through which consumers are to read a validated value, distinguishing it from a raw string. Routing consumers through those branded outputs (rather than re-reading the raw environment) is the direction this decision commits to; the gate establishes the schema as the single point where the environment is proven valid.

The schema and its parsing entry point live in the shared validation surface, not in the process-only tree, because validating external values is a concern shared with other surfaces rather than a property of the server runtime. The startup gate is the server's _use_ of that surface; the surface itself is reusable.

## Alternatives considered

### No explicit validation — read variables where they are needed

Let each consumer read its environment variable at the point of use and coerce it ad hoc. Rejected because the failure surfaces late, scattered, and inconsistently: a missing variable becomes a `NaN` port or an `undefined` identity that fails deep in startup or mid-request, with no single place that reports the whole problem and no guarantee the process refuses to start.

### Validate, but warn and continue on failure

Run the schema check but treat failures as warnings, letting the process start with whatever defaults or partial values it has. Rejected because a server that starts in a half-configured state is worse than one that refuses to start — it passes a liveness probe, accepts traffic, and fails in ways that are harder to attribute back to the configuration error than a clean refusal at startup would be.

### Validate after constructing the framework instance

Build the server instance first, then validate the environment, so validation can use the instance's logger. Rejected because it inverts the dependency: the environment governs how the instance should be built (the port it binds, the identity it carries), so validating after construction means constructing from values not yet known to be valid, and unwinding a partially-built instance on failure is more work than never building it.

### Throw on the first invalid variable

Use the throwing parse path and let the first failure abort. Rejected because it forces the fix-one-re-run-discover-the-next loop on a contributor with multiple unset variables. The non-throwing path collects every issue, and the formatter reports them together — the diagnosability force wins here.

### Bind the schema to the server runtime

Place the schema and its parsing entry in the process-only tree, since the server is its only current caller. Rejected because validating external values is not a server-runtime property; binding it there would force a future non-server surface that needs the same machinery to either reach into the server tree or duplicate the surface. The shared placement keeps the validation machinery reusable and the server's role as one consumer of it.

## Consequences

- **A malformed environment stops the process before it can serve traffic.** The non-zero exit on failure means a supervisor or orchestrator sees a failed start, not a healthy-looking but misconfigured worker.
- **Validity is proven once, at the gate.** Validation runs first and range-checks the environment, so by the time startup proceeds the environment is known to satisfy the schema. The schema's branded outputs are the typed contract consumers are to read a validated value through — distinguishing it from a raw string — and routing reads through that contract rather than re-reading raw values is the direction this decision sets.
- **A fresh checkout reports every configuration problem at once.** Routing failures through the full-set formatter means a contributor fixes the whole environment in one pass rather than iterating one variable at a time.
- **The validation surface stays reusable.** Keeping the schema and parsing entry in the shared tree means a future surface that needs to validate external values reuses the same wrapper, schemas, and formatter rather than reinventing them; the server is one consumer, not the owner.
- **The gate is a fixed point in the startup order.** "Validate first, construct second, listen last" becomes an invariant a reviewer can check; moving validation later, downgrading it to a warning, or re-reading raw values past the gate are each regressions against this decision.
- **Variables not yet moved into the environment layer remain literal until they are migrated.** This decision governs the variables that flow through the environment today; it does not require every configurable value to move into the environment at once. Migrating a further value into the validated surface follows the same shape established here.

## Related

- [`../code-reviews/plans/validation.plan.md`](../code-reviews/plans/validation.plan.md) — the value-validation review plan whose startup-gate criteria enforce this decision.
- [`../code-reviews/plans/server.plan.md`](../code-reviews/plans/server.plan.md) — the surrounding bootstrap discipline (construction order, listen/cleanup path) this gate runs ahead of.
- [ADR-0003](./0003-single-port-integrated-stack.md) — the single-listener reserved port this gate validates the environment ahead of binding.
- [ADR-0008](./0008-typescript-strict-stance.md) — the strict-plus TypeScript stance under which the branded validated outputs are enforced.
