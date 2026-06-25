# Testing Conventions

This README is the **canonical project doc** for testing conventions. Where the upstream `vitest` skill and this README diverge, **this README wins** — the skill teaches the API surface; this doc teaches how the codebase uses it.

## Scope

What lives in this folder, conceptually:

- The runner contract — Vitest mode, worker model, concurrency rules
- Spec authoring conventions — file layout, naming, data shape, assertion style
- Shared infrastructure conventions — what setup files, helpers, and probes are for and what they may not become
- Debug and diagnostics tooling — the pollution probe

Implementation lives under the project's Vitest config and the `helpers/` folder it loads. This doc describes the rules; the implementation is movable.

## File layout

- **Specs live next to source.** A unit under test ships its `*.spec.ts` (or `*.spec.tsx`) in the same folder. Specs are not collected under a separate top-level `__tests__/` tree.
- **Spec suffix is `.spec.ts(x)`, not `.test.ts(x)`.** Pick one and stay there — the runner glob targets `.spec` only.
- **Shared infrastructure lives under `.configs/vitest/`.** Setup files, helpers, fixtures, and any future smoke or scope-specific configs all live there. Application code never imports from `.configs/`.

## Worker model and concurrency

Three settings shape every spec in this repo:

- **`isolate: false`** — a single worker reuses module context across files. Faster startup; helpers and any module-level state persist for the worker's lifetime.
- **`sequence.concurrent: true`** — tests inside a file run concurrently by default.
- **`sequence.shuffle.{files, tests}: true`** — ordering is randomised. Specs that depend on ordering will fail loudly.

Implications you must internalise:

- **Helpers under `.configs/vitest/helpers/**` are stateless dispatchers.\*\* Module-level state in a helper outlives every spec in the worker and leaks across files. If a helper needs per-spec state, scope it inside the function the helper exports — never inside the module body.
- **Advancing the shared fake clock from a `.concurrent` test is forbidden.** Fake clocks are global to the worker; sibling tests in the same file share them. Installing a fixed clock with `vi.setSystemTime` and restoring real timers in cleanup (Pattern A) is permitted under concurrent execution — sibling tests converge on the same fixed instant. Calling `vi.useFakeTimers()` and then advancing the clock (Pattern B) breaks siblings' pending timers; hoist the clock to `beforeAll`/`afterAll` or use a deterministic-clock pattern that does not advance the shared fake timer.
- **No reliance on test order.** Inside a file, between files, or between runs.

## Spec conventions

### Suite shape

- Top-level `describe` block per public surface (one per exported namespace, helper, or component).
- Nested `describe` per method or behaviour. The `describe` callback receives a **suite collector**: it _is_ the suite's `it`, and it also carries the suite's lifecycle hooks (`beforeAll`, `beforeEach`, `afterAll`, `afterEach`) as properties. Pull `it` and whichever hooks the suite needs from that collector — either name it `it` and read the hooks off it (`const { beforeAll } = it;`), or destructure them straight from the parameter (`({ beforeAll }) => …`) — rather than importing them at module scope. Reaching past the collector loses the per-block scoping the runner provides.
- Pull `expect` from the test context (`async ({ expect }) => …`) rather than the module-level import. The context-local `expect` carries per-test identity, which is required because `clearMocks: false` (see below). The same rule applies to anything else the test context exposes (e.g. `task`, `onTestFinished`, `annotate`).
- **Module-level imports from the runner are reserved for what neither the suite collector nor the test context exposes:** `describe` itself (the entry point), and the `vi` utility object (worker-global, not suite-scoped). Treat any other module-level pull from the runner — an `it`, a lifecycle hook, `expect`, `onTestFinished` — as a smell: the scoped form was overlooked.

### Test data — the `TEST_DATA` constant

Every spec that uses inputs, fixtures, or table-driven cases collects them into a single `TEST_DATA` object frozen with `as const`. Conventions:

- Specs open in this order: imports → setup-factory destructure (shared fixtures plus the helpers/leak-tracker the spec needs, from one **synchronous** `<Project>Setup()` call — no `await`, and the annotation is the factory's plain return type, not an awaited form) → leak-tracker call (the state-probe helper, scoped by label) → unit-under-test destructure → frozen `TEST_DATA` → `describe`. The current identifiers live in `.configs/vitest/setup.ts` and the helpers folder it loads (operational hint).
- Keys are `SCREAMING_SNAKE_CASE` and describe the case group (`DELAY_CASES`, `ESCAPE_HTML_CASES`) or the named value (`PENDING_DELAY_MS`).
- Table-driven cases are arrays of objects shaped `{ name, …case-specific inputs, expected? }`. The `name` is what `it` receives. Per-case input keys are named after the parameter under test (`value` for predicates, `input` for transforms, `ms` for durations, etc.). An `expected` key is included whenever the spec asserts an exact value; predicates that assert `true`/`false` may omit it.
- `TEST_DATA` carries inert data plus two kinds of getter, and **nothing closes over mutable module state**. Inert members are plain literals, inspectable at a glance. A **function getter** — camelCase (`makeInstance`, `lookupPort`), returning a builder, factory, or mock implementation — is **rest-spread out** of the literal into its own binding (`const { makeThing, ...TEST_DATA } = { …, get makeThing() { return () => …; } } as const;`) so `TEST_DATA` holds no functions; this is the default for every function getter, and a getter that returns a fresh instance per call is how a unit that mutates its argument avoids a shared fixture. A **data getter** — `SCREAMING_SNAKE` (`REJECTION_CASES`, `FAILURE_CASES`), returning computed data that reads sibling members via `this` — **stays on `TEST_DATA`** (read via `TEST_DATA.X`), keeping cross-referencing case tables in one place instead of hoisting their inputs to module-scope consts.

### Shared fixtures

Common, domain-neutral values — booleans, representative strings and numbers, small common collections, empty collections, the `null` / `undefined` / `NaN` sentinels, a valid-configuration fixture, and the sanctioned unknown-cast helper — live once in a single frozen fixture bundle exposed through the setup factory's return value (the same call that yields the helpers and the leak-tracker). A spec destructures the fixtures it needs and references them by name inside its own `TEST_DATA` rather than re-declaring literals.

- **The dividing line.** A reusable, behaviour-neutral primitive or sentinel that several specs would otherwise re-type belongs in the shared bundle; a case table, a behaviour-specific expectation, or a fixture meaningful to one unit only stays in that spec's `TEST_DATA`. Both a hand-rolled primitive the bundle already provides and a one-off value pushed into the bundle are smells.
- **Derived fixtures belong in the bundle, never in a spec.** The shared bundle may compose a fixture from its own primitives — including running a real schema or transform so the fixture cannot drift from the production contract it mirrors. That composition is confined to the bundle; per-spec `TEST_DATA` stays inert.
- **Literal types must survive.** Shared primitives are declared so their literal type — not the widened type — reaches the specs, because the type-level assertions that consume them assert against the literal (a template-literal or mapped type derived from the input). Widening a shared primitive silently degrades those assertions into tautologies.
- **Assert against the shared constant**, not a re-typed inline literal: it keeps the literal type flowing and the assertion greppable.

### Assertion style

- Destructure `expect` from the test context (above) — not the top-level `vitest` import — so each assertion carries per-test identity.
- Prefer specific matchers (`toBe`, `toEqual`, `toBeInstanceOf`, `toBeGreaterThanOrEqual`) over generic `truthy`/`falsy` checks.
- No snapshot tests by default; introduce one only when the assertion's value is genuinely opaque and the snapshot is small.

### Mocking

- **`clearMocks: false` is deliberate.** Mocks accumulate calls across the whole worker. Specs must filter `mock.calls` by per-test identity (the `expect` context object, or another per-test reference) instead of assuming a clean state.
- Use `vi.mock` at module scope to substitute a dependency for the whole file.
- Avoid `vi.spyOn` on shared modules unless the spy is restored in `afterEach` — the absence of automatic clearing turns a forgotten restore into a cross-test leak.
- **Reset shared-mock implementations, in the suite that installed them.** A mock that persists across files (its substitution outlives every file under `isolate: false`) leaks any implementation left installed into the next file. Tear it down — `mockReset` / `restoreAllMocks` — in the `describe` that set it, **not** in a file/root-level `afterAll`: the pollution probe takes its file-exit snapshot from a root-level hook, child-suite hooks drain before it, but a sibling root-level teardown runs in parallel and can fire _after_ the snapshot, producing a spurious leak report.
- **The pollution probe tracks shared mocks and installed spies.** At the file boundary it compares the implementation each shared mock carries, and flags any `vi.spyOn` on a shared or global object that was not restored. Still outside it: a per-file `vi.mock` factory whose module another spec can import — restore or unmock it in-file, or promote the mock into the shared-mock surface so the probe covers it.

## Shared infrastructure

### Setup file

A single setup file is loaded by the runner before each spec. Its primary job is to expose, as a namespaced bundle the spec destructures, both the helpers the spec needs and the shared test-data fixtures.

The setup file is also the **only** place infrastructure-level state may live — for example, a registry that records which spec files have installed a fake clock, used at file-exit by the state probe to flag concurrent-test + fake-timer risk. State that must outlive a single helper invocation goes here, not in a helper module. Setup files run before specs and are evaluated once per worker under `isolate: false`, so any module-level state they hold persists for the worker's lifetime — that is deliberate; helpers do not get the same allowance.

### Setup-factory consumption pattern

Specs do not import helpers — or the shared fixtures — directly from their source modules. They go through a **synchronous**, zero-arg factory exposed by the setup module — `const { someHelper } = <Project>Setup();`, with no `await` — and destructure both the helper bundle and the shared-fixture namespace from its return value. Both the factory identifier (`<Project>Setup`) and the per-helper names are placeholders; their actual identifiers live in the setup module and the helpers folder, and the factory's return type widens automatically as helpers — or shared fixtures — are added. Three roles justify the indirection:

1. **Force the side-effect import.** Routing every spec through the setup module guarantees the runner-required side-effects (matcher extensions, hijack installation, environment shims) are evaluated before the spec's collection begins. Setup is also registered as a `setupFiles` entry for the same reason — the factory is the belt to that suspenders.
2. **Host the cross-spec hijack installation.** Any monkey-patch the probe needs (e.g. intercepting the fake-timer install site to attribute it to a file path) lives next to the factory so it installs exactly once per worker.
3. **Make helper additions transparent to consumers.** Adding a new helper namespace to the bundle does not require touching any spec — the factory's return type widens to include the new keys, and existing destructures continue to work.

When proposing to drop or replace the factory, account for all three roles, not just the destructuring sugar.

### Jest-compatibility surface

Some Vitest APIs ship for Jest parity rather than as first-class documented surface. The most-used example: `expect.getState().testPath` returns the current spec's absolute path. The probe and both setup hijacks (fake-timer attribution and spy attribution) depend on it.

Major-bump reverify checklist for this surface:

1. Confirm `expect.getState().testPath` is still populated when called inside `beforeAll` / `beforeEach` / `afterAll`.
2. Confirm the field still holds the **absolute** path (not a relative or fragment form).
3. If either check fails, the probe must move to a runner-native equivalent before the bump lands — the cross-spec fake-timer attribution relies on a stable per-file key.
4. Confirm `getMockImplementation()` still returns `undefined` for a pristine or freshly-reset mock and a **stable reference** otherwise (truthy for a permanent implementation and for an unconsumed one-shot queue). The shared-mock leak diff compares these references across the file boundary; if the return contract changes, the diff inverts or dies silently and must be re-derived before the bump lands.
5. Confirm `vi.spyOn` can still be wrapped, and that a spy keeps occupying its target slot until `mockRestore` / `restoreAllMocks` puts the original back (`mockReset` / `mockClear` must leave it installed). The spy-leak diff reads the slot at file exit; if the slot or restore semantics change, it must be re-derived before the bump lands.

The general rule: when reaching past the documented context-scoped API into a Jest-compat shape, pin the assumption in an inline comment at the call site and treat the dependency as a major-bump checklist item.

### Helpers — the dispatcher contract

Every helper module under the Vitest helpers folder follows the same contract:

- Exports a frozen namespace object (`<Concept>Helper`) rather than loose functions.
- Each function on the namespace is a **stateless dispatcher**: it may capture per-call state in closures, but the module itself holds no state that survives between calls.
- Helpers register lifecycle hooks (`beforeAll`, `beforeEach`, `afterAll`) inside the function body — never at module scope. A hook at module scope would attach once per worker, not once per spec.

### State-probe helper

A debug helper diffs state across test and file boundaries. At each test boundary it compares `globalThis` keys, `process` event listeners, and fake-timer state; at the file boundary it additionally compares Node active resources (`process.getActiveResourcesInfo()`), the implementation each shared mock carries, and whether any spy was left installed on a shared or global object. Specs invoke it once at the top of the file (passing a label for log output). It is silent by default and only emits when explicitly enabled — see below.

Active resources are file-boundary-only, increase-only, and settled: a handle is reported only if its count grows and survives a short drain of transient worker, scheduler, and environment handles (the table is sampled twice and the per-key minimum is kept) — unless a spec left fake timers installed (itself flagged as a leak), in which case the settle is skipped and the unsettled snapshot is used, because the settle awaits real timers a still-installed fake clock would never fire. The per-test window is too short and overlaps concurrent siblings too heavily for the process-global active-resource table to attribute reliably, so it is excluded from the per-test diff. Only Node libuv handles appear on this surface — environment-level timers such as happy-dom's are not Node handles and are invisible to it, so a leaked environment timer is not caught here.

Shared-mock implementations are file-boundary-only and directional. A mock that persists across the worker (its module substitution survives every file under `isolate: false`) is snapshotted by its implementation _reference_ at file entry and exit; a reference that both changed and is non-empty at exit is flagged, because the next file in the worker inherits that behaviour. Installing an implementation, and swapping one over an implementation an earlier file already leaked in, are both caught — and comparing references rather than a has-an-implementation flag keeps each file's verdict independent of run order under shuffle. Clearing an implementation (the intended teardown) is not flagged; an unchanged reference means the file never touched the mock; and accumulated calls are excluded by design, since specs isolate their own calls by per-test identity. As with active resources, the per-test window overlaps concurrent siblings too heavily to attribute a mid-flight implementation change, so this surface is excluded from the per-test diff.

Installed spies are file-boundary-only as well. A spy on a shared or global object replaces a slot that, under `isolate: false`, outlives the file; each spy is recorded against the file that created it (so it is judged at its own exit), and is flagged if its target slot still holds the spy at file exit — the signal that it was never restored. Restoring the original (`mockRestore` / `restoreAllMocks`) clears the signal; resetting or clearing the spy does not, because those leave it installed. Restoring anywhere before file exit suffices. Like the other file-boundary surfaces it is excluded from the per-test diff, since concurrent siblings share the object.

The probe itself is a stateless dispatcher: every per-spec snapshot lives in a closure scoped to its invocation. The cross-spec signal — flagging concurrent tests that touched the clock — is read from a setup-owned registry, keeping the helper module free of module-level state.

## Debug and diagnostics

### `DEBUG_TEST_POLLUTION`

A single environment variable gates every diagnostic output:

- **`DEBUG_TEST_POLLUTION` unset or `"0"`** — probes are no-ops. This is the default for `test` and `test:cov`.
- **`DEBUG_TEST_POLLUTION="1"`** — probes emit `[WARN …]`, `[LEAK …]`, and `[RISK …]` lines on stderr at each boundary. Used by `test:pollution`.

The contract: a green run with the probe enabled means no detected pollution; any `[WARN]`, `[LEAK]`, or `[RISK]` line is a real signal to investigate.

Output semantics:

- `[WARN <spec> <file-init>] …` — the probe could not resolve the spec's absolute path from `expect.getState().testPath`, so fake-timer attribution and registry cleanup will not run for that spec. Indicates a runtime gap rather than test-state pollution; investigate the Jest-compat surface (see the major-bump reverify checklist).
- `[LEAK <spec> > <test>] …` — a per-test surface changed between the test's start and finish: a `globalThis` key added, a `process` listener attached, or fake-timer state left flipped. (Active resources are not part of the per-test diff.)
- `[LEAK <spec> <file-exit>] …` — a per-test surface changed across the whole file lifetime, a Node active-resource count grew (increase-only, after the settle described above), a shared mock carried an implementation at file exit it did not carry at file entry (emitted as `mock.<name>=impl-leaked`), or a spy was left installed on a shared or global object (emitted as `spy.<name>=not-restored`).
- `[RISK <spec> > <test>] concurrent test advanced fake timers — sibling tests share the clock` — a `.concurrent` test advanced the shared fake clock (Pattern B). Installing a fixed clock without advancing it (Pattern A) is not flagged.
- `[RISK <spec> <file-exit>] fake timers were advanced in this spec — under concurrent execution sibling tests share the clock. Hoist the clock to beforeAll/afterAll or use a deterministic-clock pattern that does not advance the shared fake timer.` — the spec file advanced the shared clock at some point during the run. Hoist the clock to a `beforeAll`/`afterAll` pair, or refactor to Pattern A if a fixed instant is sufficient.

## When to deviate

Every rule above exists because of a documented trade-off. Before deviating:

1. Confirm the trade-off in the relevant inline comment (Vitest config) or in [ADR-0005](../adr/0005-test-runner-worker-model.md).
2. If the deviation is principled, write a follow-up to update this README — single-spec exceptions rot the convention for everyone else.

## Related

- [ADR-0005](../adr/0005-test-runner-worker-model.md) — the runner posture (worker model, concurrency, mock-clearing) the conventions in this README rest on
- [ADR-0006](../adr/0006-test-setup-and-pollution-probe.md) — the setup factory and gated pollution probe whose consumption pattern, output semantics, and reverify checklist this README elaborates
- [ADR-0019](../adr/0019-mock-state-leak-detection.md) — the mock-state leak surfaces (shared-mock implementations, installed spies) and the teardown-placement and reset-not-clear conventions they impose
- [`../code-reviews/plans/testing.plan.md`](../code-reviews/plans/testing.plan.md) — review checklist for changes to testing infrastructure or specs
- [`../../.claude/rules/invocations/vitest.md`](../../.claude/rules/invocations/vitest.md) — when to invoke the upstream `vitest` skill, and the precedence rule with this README
