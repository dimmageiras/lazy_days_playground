# 0019. Mock-state leak detection in the pollution probe

- **Status:** Accepted
- **Date:** 2026-06-30

## Context

The pollution probe ([ADR-0006](./0006-test-setup-and-pollution-probe.md)) diffs runtime state — global keys, process listeners, fake timers, Node handles — across test and file boundaries, but it never inspected mock state. Under the non-isolated worker ([ADR-0005](./0005-test-runner-worker-model.md)) mocks are worker-global: a mock left carrying an implementation, or a spy left installed on a shared or global object, survives the file that set it and stubs whatever runs next. Because `clearMocks: false` makes call accumulation deliberate — specs filter their own calls by per-test identity — the leak is never the calls; it is the _behaviour_ a file leaves installed. Nothing flagged it, so a forgotten reset merged green and surfaced later, intermittently, under shuffle.

## Decision

Extend the probe with two file-boundary surfaces that watch installed behaviour, not calls.

**Shared-mock implementations.** For each mock in the project's designated shared-mock bundle, snapshot its implementation _reference_ at file entry and at file exit, and flag a reference that both changed and is non-empty at exit. This catches a freshly installed implementation and one swapped over an implementation an earlier file already leaked in. Comparing references — not a has-an-implementation boolean — keeps each file's verdict independent of run order, so an upstream leak cannot mask a downstream one.

**Installed spies.** Hijack spy creation once per worker (the mechanism the fake-timer attribution already uses), recording each spy against the file that created it. At that file's exit, flag any spy whose target descriptor still holds it — the signal it was never restored. Inspect the descriptor rather than the read value, so an accessor spy is detected without invoking its getter inside the hook.

Both surfaces are **file-boundary only** and **directional**: only a newly carried behaviour is a leak; clearing one is the intended teardown and stays silent. Per-test attribution is rejected for the same reason active resources are — concurrent siblings share the worker-global mock, so a mid-test change cannot be pinned to the test whose window it fell in.

## Alternatives considered

- **A has-an-implementation boolean** rather than the reference: rejected — it cannot see an implementation swapped over an already-leaked one, and under shuffle an upstream leak masks every downstream file's, contradicting the no-reliance-on-order posture.
- **Per-test mock-state diffing**: rejected — concurrent siblings mutate the shared mock, so a change cannot be attributed to one test.
- **Enumerating the runner's internal mock registry**: rejected — not a public surface. The probe watches the project's shared-mock bundle (the set that can actually cross files) and hijacks spy creation instead.
- **A manual breadcrumb tracer** (sprinkled log calls, correlated by hand): rejected for this class — an implementation or slot identity is automatically diffable, so a snapshot beats instrumentation. A tracer remains the right tool for `vi.mock` factory-ordering races, which are not auto-detectable and stay out of scope.

## Consequences

- A green probe run now also means no shared-mock implementation leaked and no spy was left installed on a shared or global object.
- Two conventions follow, recorded in the testing conventions doc: shared-mock teardown must live in the child suite that installed it — a file/root-level teardown races the probe's own file-exit snapshot under parallel hooks — and shared mocks must be torn down with reset-not-clear semantics, since clearing leaves the implementation installed.
- Accepted scope limits: a per-file module mock whose module another spec can import is not tracked (only the shared bundle is), and call accumulation is excluded by design.
- The diagnostic now also rests on the mock-implementation accessor's return contract and on spy slot-and-restore semantics; both are added to the major-bump reverify checklist.

## Related

- [`./0005-test-runner-worker-model.md`](./0005-test-runner-worker-model.md) — the non-isolated, concurrent, shuffled worker whose mock persistence makes these leaks possible.
- [`./0006-test-setup-and-pollution-probe.md`](./0006-test-setup-and-pollution-probe.md) — the pollution probe this decision extends with mock-state surfaces.
- [`../testing/README.md`](../testing/README.md) — the canonical testing conventions: the shared-mock teardown-placement and reset-not-clear rules, the probe's output semantics, and the major-bump reverify checklist.
