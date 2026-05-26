# 0002. Test runner worker-model contract

- **Status:** Proposed
- **Date:** 2026-05-26

## Context

The project's unit-test runner is Vitest. Out of the box, Vitest can be configured along several independent axes — per-file worker isolation, sibling-test concurrency, file and test ordering, automatic mock clearing between tests. Each axis has a default that is safe but conservative; together the defaults trade startup cost and noise for a strong "each test starts from a clean slate" guarantee.

A playground codebase pays the startup cost on every save (re-running specs is the inner loop) and gains very little from the clean-slate guarantee when the suites are small and the worker context is reused for a single concept. The flip side is real: relaxing the defaults means every helper, every shared piece of test infrastructure, and every spec has to be written to a tighter contract than the one Vitest assumes by default.

The decision below picks a worker-model posture as a **package** — a set of runner flags that are individually defensible but whose value comes from being combined and enforced together. Spelling the combination out as an ADR exists because each flag forces a contract on a different downstream surface (helpers, the cross-spec pollution probe, every spec's mock-call assertions, every spec's import style, every helper module's structure). A new contributor flipping any one "back to defaults" without understanding the others would silently break the contracts that depend on the others.

## Decision

The project pins the following runner settings as a single load-bearing combination:

- **`isolate: false`** — one worker context per file, reused across files.
- **`sequence.concurrent: true`** — tests inside a file run concurrently by default.
- **`sequence.shuffle.{files, tests}: true`** — file order and in-file test order are both randomised.
- **`clearMocks: false`** — mock call history is **not** cleared between tests.
- **`globals: false`** — no global runner symbols; every spec imports `describe`, `it`, `expect`, etc. explicitly.

These settings are treated as a contract: every helper, spec, and shared test-infrastructure module is written to be safe under the combination, and any deviation requires a new ADR that records what changes and why.

## Alternatives considered

### Vitest defaults (`isolate: true`, sequential tests, no shuffle, `clearMocks: false`)

The conservative posture. Each spec file gets a fresh worker context; tests inside a file run sequentially; order is stable run-to-run. Rejected on performance and signal grounds: per-file worker isolation pays a startup tax on every save in a fast inner loop, sequential execution masks accidental ordering dependencies until the suite is large enough to matter, and the shared-worker contract this ADR adopts is cheap to enforce when the surface is small and disproportionately expensive to retrofit later.

### `isolate: false` with sequential, ordered tests

Keep the single-worker speed-up but stay sequential and stable-ordered. Rejected because the ordering signal is the whole point of running shuffled — a shuffled run that fails reveals a real cross-test coupling that a stable order would hide indefinitely. Concurrency-by-default is an additional production benefit (some specs run twice as fast for free), but ordering randomisation is the load-bearing piece.

### `clearMocks: true` (clear mock call history between tests)

Trades the per-test-identity filter convention for "every test sees an empty `mock.calls`". Rejected under `sequence.concurrent: true`: sibling concurrent tests share the worker's mock instances; auto-clearing between them races siblings that have just made calls but not yet asserted. Per-test identity filtering (using the context-local `expect`) is concurrency-safe and is the convention the project standardises on.

### Add `.sequential` to specs that need stable order

A targeted carve-out: leave the runner concurrent-by-default and mark the few specs that genuinely need stable order as sequential. Rejected as the default escape hatch — the project's convention is that any spec that cannot run concurrently is a smell to investigate (shared-clock advances, file-scoped mutation, ordering coupling), not a flag to add. The carve-out remains available but is not the policy.

## Consequences

The four-flag combination forces a contract on every downstream piece of test infrastructure and every spec:

- **Helpers under the shared test-infrastructure tree are stateless dispatchers.** Module-level state in a helper outlives every spec in the worker under `isolate: false`, so any helper that needs state captures it inside the closure of the function it exports, never at module scope. The exception is the setup module, which is explicitly allowed to hold cross-spec state (e.g. a registry the probe reads at file exit) because some of its responsibilities require it.
- **The cross-spec pollution probe is feasible.** Diffing `globalThis` keys, process listeners, active resources, and fake-timer state across each test boundary and the file boundary, and attributing fake-timer advances to a specific file, both rely on the worker outliving the file — `isolate: true` would make the cross-file attribution impossible.
- **Specs filter `mock.calls` by per-test identity.** Because mocks are not cleared between tests, assertions that compare lengths or scan call arguments must be scoped to the per-test reference (typically the context-local `expect`) rather than assuming an empty starting state.
- **Concurrent execution forbids advancing the shared fake clock from `.concurrent` tests.** Vitest's fake clock is global to the worker; advancing it from one concurrent test invalidates pending timers in its siblings. Setting a fixed instant via `vi.setSystemTime` and restoring real timers in cleanup is permitted; advancing the clock is not. The pollution probe flags Pattern-B advances as `[RISK]`.
- **Order randomisation forbids ordering dependencies.** Specs that pass only under a particular file order or test order will fail on a shuffled run — that is the intended signal.
- **No reliance on the `globals` shorthand.** Every spec imports the runner symbols it uses, which keeps each spec readable on its own and makes the worker-shared nature of those imports explicit. Without this, a runner upgrade that changed the global surface (or a future migration off Vitest) would touch every spec implicitly; explicit imports localise that cost.

A deviation from any of the pinned flags is an ADR-level change, not a per-spec or per-helper choice. The full set of conventions these flags imply (suite shape, `TEST_DATA` discipline, the setup-factory consumption pattern, the Jest-compatibility-surface reverify checklist) lives in the project's testing README; this ADR records the **runner posture** the conventions rest on.

## Related

- [`../testing/README.md`](../testing/README.md) — canonical project testing conventions; this ADR records the runner posture the README's rules rest on.
- [`../../.claude/rules/invocations/vitest.md`](../../.claude/rules/invocations/vitest.md) — when to invoke the upstream `vitest` skill and the precedence rule with the testing README.
- [ADR-0007](./0007-helper-namespace-pattern.md) — the helper namespace shape that test-infrastructure helpers follow; this ADR layers the stateless-dispatcher contract on top of it.
- [`../code-reviews/plans/testing.plan.md`](../code-reviews/plans/testing.plan.md), [`../code-reviews/plans/test-infra.plan.md`](../code-reviews/plans/test-infra.plan.md) — review criteria that enforce this contract on specs and shared test infrastructure.
