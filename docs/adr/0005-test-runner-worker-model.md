# 0005. Test runner worker-model contract

- **Status:** Accepted
- **Date:** 2026-06-16

## Context

The unit-test suite must stay fast on every change without a separate build step. The biggest controllable cost in a run is not assertion execution but per-file overhead: re-creating a fresh module graph and environment for each spec. Paying that cost once and reusing the context buys speed; paying it per file buys isolation. The suite chooses speed.

That single choice is not independent of the others. The worker model, concurrency policy, ordering policy, test-API surface, mock-clearing default, and DOM environment interact: reusing a context changes what shared infrastructure may hold; running tests concurrently changes what shared mutable state (mocks, clocks) is safe to touch; randomising order changes what a spec may assume; and clearing mocks between tests is only safe when tests run one at a time. Decided piecemeal these knobs contradict each other. They are decided here as one posture.

Two layout questions ride on the same boundary, because they too are expensive to reverse once specs spread across the tree: _where specs live and how they are named_, and _where shared test infrastructure lives and who may depend on it_. The runner collects by glob, so the collection glob and the filename suffix are coupled — a file under any other suffix is silently dropped, contributing zero assertions while still appearing in listings and review. And the machinery the tests need (setup, helpers, the cross-spec registry, the diagnostic probe) is not part of the shipped product; if it sits in the source tree under the runtime's compilation surface, the runtime build can pull a test-only module into the product. This ADR records the unified posture all of the above must satisfy.

## Decision

The runner trades isolation and determinism for startup speed, and every piece of test infrastructure is written to be safe under that trade. The posture has these facets:

- **A reused, non-isolated, thread-pooled worker context.** One worker context is reused across spec files rather than re-created per file. Module-level state therefore lives for the worker's lifetime and is visible to every later spec in that worker. The binding consequence: **every shared test helper must be a stateless dispatcher** — it holds no module-scope state; any state that must outlive a call is captured in a closure or owned by the setup layer, never parked at helper module scope.

- **Concurrent tests with parallel lifecycle hooks.** Tests within a file run concurrently and hooks run in parallel, so siblings share whatever is global to the worker — the mock registry, any installed fake clock. Specs may not assume sole ownership of a shared clock, a clean module state, or a fixed neighbour state.

- **Randomised ordering of files and tests.** Order is shuffled at both levels, so any spec that depends on running before or after another fails loudly instead of passing by accident. A green run is evidence the suite is order-independent; reproducing a specific run requires capturing the seed.

- **An explicit, non-injected test API.** Test functions and the assertion object are not ambient globals; each block pulls them from its enclosing callback and the per-test context. A context-scoped assertion object carries per-test identity that an ambient global cannot — and that identity is what lets concurrent siblings disambiguate shared state.

- **Automatic mock clearing stays off; specs filter by per-test identity.** Recorded calls accumulate across the worker rather than resetting at each test boundary. An automatic between-test clear would fire while concurrent siblings are still reading the same mock, wiping records out from under an assertion that has not run yet — a non-deterministic race driven by interleaving and shuffle. So the contract shifts onto the spec: an assertion must isolate its own calls from the shared log by a reference unique to that test (a distinctive per-test marker argument it filters on, or the per-test assertion handle), then assert on that slice. Flipping clearing back on, or resetting mocks between tests, is prohibited — it silently breaks every accumulation-reliant spec and reintroduces the race. A spy on a shared module must be restored in a teardown hook, since without clearing a forgotten restore is a cross-test leak. This contract is only enforceable because the assertion handle has no global form, which is exactly why the explicit-test-API facet above is load-bearing rather than stylistic.

- **A lightweight DOM environment.** A fast DOM implementation is chosen over a spec-heavier one for instantiation speed, with one accepted blind spot: its environment-level timers are not the runtime's libuv handles, so a leaked environment timer is invisible to handle-based leak detection.

- **Co-located specs under one exclusive suffix.** A unit ships its spec in the same folder under the `.spec` suffix; there is no separate top-level test tree. The runner glob targets that suffix and nothing else, so the suffix is a hard convention, not a preference — a mis-suffixed file collects nothing.

- **Test infrastructure quarantined outside the source tree.** Setup, helpers, the registry, the probe, and any scope-specific configs live in a dedicated test-infrastructure directory. The product's runtime code never imports from it; specs and other infrastructure reach it through the project's path-alias scheme, keeping the dependency one-directional. That boundary is enforced structurally rather than by convention — the composite project-reference partition that separates the spec-plus-infrastructure surface from the runtime surface (and the spec-exclusion that keeps the dependency one-directional) is owned by the compiler-stance decision, not re-specified here.

## Alternatives considered

- **Isolated context per file (re-create the module graph for each spec).** Clean state by construction, no stateless-helper discipline needed. Rejected: per-file context cost dominates the run as spec count grows, and the project values fast feedback over letting helpers hold state.
- **A separate process per spec file.** Maximum isolation — process boundaries make cross-file leakage impossible. Rejected for the same reason as per-file isolation but more so: process spin-up is the heaviest per-file cost, and it is unnecessary for a suite that manages shared state explicitly.
- **Serial, in-order execution (no concurrency, no shuffle).** Removes shared-mock and shared-clock hazards and is reproducible by construction. Rejected: it leaves parallelism on the table and lets order-dependence accumulate silently until the day the order changes. (This is also the only world in which automatic per-test mock clearing would be safe — abandoning concurrency to keep a clearing convention inverts the priority the worker model exists to serve.)
- **Ambient global test API.** Less ceremony per spec. Rejected: an ambient assertion object is a single shared identity, so under concurrency there is no per-test handle to attribute shared mock calls or clock usage to — the exact disambiguation concurrency needs.
- **Re-enable automatic mock clearing, or reset mocks between tests.** Restores the familiar empty-call-log-per-test expectation; reset goes further and drops stubbed implementations too. Rejected: the between-test boundary overlaps siblings still using the mock, corrupting their records non-deterministically, and reset additionally tears down implementations concurrent siblings depend on.
- **Give each spec a freshly-instantiated mock per test.** Nothing shared, nothing to filter. Rejected: for spies on shared globals and module-level mocks the thing being mocked is genuinely shared in the worker, so this pushes teardown into the concurrent window where it races siblings.
- **A spec-heavy DOM environment.** Shrinks the environment blind spot. Rejected: materially slower to instantiate, and the run-speed budget is the whole point; the timer blind spot is documented and handled instead.
- **Central top-level test tree.** Collect every spec under one tree separate from source. Rejected: it severs the spec from its unit, so a source move orphans the spec and a reader cannot tell at a glance whether a unit is tested. Co-location keeps both in the same blast radius of a refactor.
- **Allow multiple test suffixes.** Broaden the glob for author convenience. Rejected: it doubles the surface where the suffix-glob trap bites and invites drift; one accepted suffix makes a mis-suffixed file fail to collect loudly during review, two hide the mistake.
- **Keep test infrastructure inside the source tree, distinguished by naming only.** Rejected: it lets the runtime build reach test-only modules and forces the runtime type-check to share an environment with test-only types. A quarantine directory makes the dependency direction physical.
- **Enforce the runtime/infrastructure boundary by lint rule or convention only.** Rejected: a convention catches violations only when the tool runs and is configured; a partitioned build graph makes the violation a type error by construction — and the composite split is needed anyway to give the test surface its environment.

## Consequences

**Positive**

- Fast startup and fast runs: worker context and DOM environment are created once and reused, so per-file overhead stays low as the suite grows.
- Order-dependence cannot hide — shuffling turns any latent ordering assumption into a visible failure rather than a future flake.
- Real concurrency within a file, with per-test identity available by construction so shared-state assertions stay honest; the "filter the shared log by my own identity" discipline is robust against interleaving and ordering.
- The constraint is self-reinforcing: because the per-test assertion handle has no global form, a spec that reaches for a shared assertion entry point fails to compile or stands out, keeping per-test identity available everywhere it is needed.
- A single coherent contract the rest of the infrastructure is designed against, rather than a pile of independently-set knobs.
- A mis-suffixed spec is a named trap with a one-line rule, not a silent coverage hole; a spec and its unit move, rename, and get reviewed together.
- The product can never ship or type-check against test-only infrastructure — the boundary lives in the build graph — and imports resolve identically under test and at runtime because the test project mirrors the runtime aliases.

**Accepted negatives**

- **No isolation.** State leaks across files within a worker by default; this is the price that forces the stateless-dispatcher contract and the setup-owned-state rule. Infrastructure that ignores the contract leaks silently.
- **Shared mutable state is hazardous under concurrency, and the mock contract inverts the default.** The accumulating call log is a genuine newcomer trap: someone who sees calls "leaking" between tests will be tempted to turn clearing on, which quietly breaks accumulation-reliant specs and brings back the race. Every assertion against a shared mock carries extra ceremony (thread a marker or capture the handle, then filter), and spies need disciplined restore-in-teardown. This must be called out wherever the setting lives and in the testing conventions.
- **Non-determinism by design.** Randomised order means a green run proves order-independence, not repeatability; reproducing a specific ordering requires the seed.
- **A DOM-environment blind spot.** Environment-level timers are not runtime handles, so handle-based leak detection cannot see a leaked environment timer. A known gap, not an oversight.
- **A standing discipline cost.** Every new helper, fixture, and spec author must understand and honour the posture; "just put it at module scope" is not available.
- **The suffix and quarantine boundaries depend on globs staying correct.** A mis-suffixed file is caught by convention and review, not a mechanical author-time guard; specs share directories with source so a folder listing mixes shipped and test code; two composite projects mean two include/exclude surfaces to keep coherent, and the one-directional quarantine holds only while the runtime project's spec-exclusion glob stays tight.

## Related

- [`./0006-test-setup-and-pollution-probe.md`](./0006-test-setup-and-pollution-probe.md) — the setup factory that owns the cross-spec state helpers may not hold, plus the gated state-diff probe and fake-timer registry that detect the leakage this posture permits.
- [`./0019-mock-state-leak-detection.md`](./0019-mock-state-leak-detection.md) — the mock-state leak surfaces the probe gained to detect another flavour of leakage this posture permits.
- [`./0002-typescript-compiler-stance.md`](./0002-typescript-compiler-stance.md) — the composite project-reference mechanism this contract uses to partition the spec-plus-infrastructure surface from the runtime surface.
- [`./0003-path-alias-scheme.md`](./0003-path-alias-scheme.md) — the alias scheme the test project mirrors so specs resolve the quarantined infrastructure identically under test and at runtime.
- [`./0001-vite-multi-target-and-dev-runtime.md`](./0001-vite-multi-target-and-dev-runtime.md) — the shared Vite base the test config composes onto.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module-vs-helper boundary the stateless-dispatcher rule applies to.
- [`../testing/README.md`](../testing/README.md) — the canonical testing conventions that elaborate and enforce this posture.
- [`../../CONTEXT.md`](../../CONTEXT.md) — defines **Spec** and **Stateless dispatcher**, the terms this decision leans on.
- [`../../.claude/rules/invocations/vitest.md`](../../.claude/rules/invocations/vitest.md) — when to invoke the `vitest` skill and the precedence of the testing README over it.
