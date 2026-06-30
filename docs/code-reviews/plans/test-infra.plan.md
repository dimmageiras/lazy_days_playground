# Code Review Plan: Test Infrastructure

## Scope

The test-infrastructure surface beneath the specs — the setup factory, the fake-timer registry, the state-probe / pollution-probe helpers, and the cross-spec mock surface. The defining property: this code runs **once per worker**, before any spec, and any state it carries persists for the worker's lifetime under the project's `isolate: false` contract. A regression here doesn't fail a spec; it lets specs lie about correctness or leak state between unrelated files.

This plan is the depth complement to [`./testing.plan.md`](./testing.plan.md). The testing plan owns spec-authoring conventions (the consumer's seat); this plan owns the infrastructure the consumer destructures from. A PR spans both seats when, for example, it adds a new helper namespace to the setup factory and a spec that consumes it, when it changes the mode-flag → env mapping and the spec-side scripts that invoke it, or when it adjusts the probe's line-shape contract and the specs that rely on the existing shape — run both plans in those cases.

Project-specific testing conventions live in [`../../testing/README.md`](../../testing/README.md). That README is canonical for the lane this plan and the testing plan jointly enforce.

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement.

- `.configs/vitest/setup.ts` (the setup module that exposes the helper and shared-fixture bundles via a zero-arg factory)
- `.configs/vitest/constants/shared-test-data.constant.ts` (the frozen cross-spec fixture bundle the factory exposes — runs once per worker, like every surface in this plan)
- `.configs/vitest/fake-timer-registry.ts` (the cross-spec registry that records which files advanced the shared fake clock)
- `.configs/vitest/helpers/**` (the stateless-dispatcher helper layer — state-probe / pollution-probe helper)
- `.configs/vitest/helpers/index.ts` (the barrel that the setup module destructures from to build the helper bundle)
- The Vite-merge / setup-files / mode → env mapping side of `vitest.config.ts` (the runner-config bindings that wire the infra in; the spec-author-facing config concerns live in the testing plan)

## Required skills

| Skill                     | Why                                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                                                                                 |
| `vitest`                  | Setup-file lifecycle, mock state semantics, fake-timer adapter, the Jest-compat surface the probe reaches into, mode-flag → env mapping             |
| `typescript-magician`     | The factory's return type widens automatically as helpers are added — `UnionToIntersection` over the helpers barrel, `as const` on the frozen value |

## Review focus

### Setup-factory contract

- The setup module exports a single zero-arg factory whose return value is a frozen bundle of every helper namespace the project ships, plus the shared test-data fixtures. Specs **destructure** both from the factory return (`const { someHelper } = <Project>Setup();`); specs do not import helpers or fixtures directly from their source modules.
- The bundle's return type widens automatically as helpers are added — a `UnionToIntersection` over the helpers barrel's exports. Adding a new helper namespace must require no change to consuming specs.
- The factory holds a single frozen value at module scope and returns the same reference on every call. Returning a fresh value per call wastes allocation and breaks reference-equality tests that may compare bundle handles.
- The setup module is registered as a `setupFiles` entry in the runner config — the registration is a **belt** to the factory's **suspenders**. Removing the registration leaves the side-effects (matcher extensions, hijack installation, environment shims) unrun until the first spec calls the factory.
- The three roles the factory plays are non-negotiable: it forces side-effect import order, it hosts cross-spec hijack installation, and it makes helper additions transparent to consumers. A proposal to drop or replace the factory must account for all three roles, not just the destructuring sugar.

### Shared fixture bundle

- The factory return also carries a single frozen object of broadly-reused primitive test values — common booleans, strings, numbers, and small collections; empty collections; the `null` / `undefined` / `NaN` sentinels; a valid-configuration fixture; and the sanctioned unknown-cast convenience. It runs once per worker before any spec, like every surface this plan owns.
- The bundle is frozen (`as const` + `Object.freeze`) and holds **no mutable entry** — a concurrent sibling could otherwise mutate a shared value, the exact hazard this plan exists to catch.
- It holds **no per-spec value**: only genuinely common primitives plus a small number of derived-but-stable fixtures. A spec-specific value added to the bundle is a finding.
- Derived fixtures are composed from the bundle's own primitives — including by running a real schema or transform so they cannot drift from the contract they mirror — never by reaching into spec state.
- Shared primitives keep their literal type (`as const` on each), because the spec-side type-level assertions assert against the literal; a widened primitive silently degrades those assertions into tautologies.

### Setup-owned state

- The setup module is **the only** place infrastructure-level state may live. Module-level state in `.configs/vitest/helpers/**` is forbidden under `isolate: false` — it persists for the worker and leaks across files.
- State that must outlive a single helper invocation (e.g. the fake-timer registry, the hijack-installed flag) lives next to the setup factory, not in a helper module.
- The setup module evaluates once per worker. Anything that should fire on every spec (snapshots, lifecycle hooks) must register from **inside** a helper function the spec invokes, not at the setup module's top level.

### Fake-timer registry

- The registry owns the global fake-timer mock surface for the worker. It captures which spec files advanced the shared clock (Pattern B) and is the source of truth the state probe consults when deciding whether to emit a risk line.
- The hijack installs **once per worker** on first call — a re-entrancy guard (`hijacked` flag) is mandatory. Re-installation would double-wrap the timer methods and corrupt the call chain.
- The hijack is **gated on the same probe flag** the helper uses (`DEBUG_TEST_POLLUTION`). When the probe is off, the registry is never read, so paying the wrapper cost is wasted. A hijack that runs unconditionally is a finding.
- The hijack wraps **only Pattern B entry points** — the methods that flush pending timers against the shared fake clock. Pattern A (`vi.setSystemTime` + `vi.useRealTimers()` cleanup) is concurrency-safe and is deliberately not tracked; expanding the wrap list to cover Pattern A is a regression of the trade-off.
- Each wrapped method binds the original, calls the attribution callback the setup module passed in, then forwards to the original with arguments preserved. Dynamic property indexing on the runner namespace (e.g. iterating method names) is forbidden — explicit per-method assignments keep the wrap auditable and avoid `no-unsafe-member-access` violations.
- The registry exposes a narrow API: record a file, query a file, clear a file. The probe's per-file teardown calls clear; cross-test state survives only between record and clear. Iteration over the registry and bulk-clear operations are excluded by design — neither is needed by the probe and both would invite cross-file coupling. Flag any addition that widens the API beyond record / query / clear.
- The registry's frozen namespace object follows the helper contract (frozen, `as const`, named functions) — even though the registry lives next to the setup module rather than under the helpers folder.

### State-probe / pollution-probe contract

- The probe is a stateless dispatcher: every per-spec snapshot lives in a closure scoped to the call site. The cross-spec signal (concurrent-test + fake-timer risk) is read from the setup-owned registry, keeping the helper module free of module-level state.
- The probe is gated on `DEBUG_TEST_POLLUTION === "1"` at the call site. When the flag is unset or `"0"`, the helper returns immediately and registers no hooks — a probe that always installs hooks is a finding (lifecycle overhead in the default path).
- The probe's hook registrations (`beforeAll`, `beforeEach`, `afterAll`) live **inside** the dispatcher function the spec calls — never at module scope. A module-scope hook attaches once per worker, not once per spec invocation.
- The probe diffs different surfaces by scope. At the **per-test** boundary it compares `globalThis` keys, `process` event listeners, and fake-timer state (`vi.isFakeTimers()` OR `vi.getMockedSystemTime() !== null` — `setSystemTime` mocks the global `Date` without flipping `isFakeTimers()`, so both signals are necessary). At the **file** boundary it compares those surfaces plus Node active resources (`process.getActiveResourcesInfo()`).
- Active resources are **not** diffed per-test: the per-test window is too short and overlaps concurrent siblings too heavily for the process-global active-resource table to attribute reliably. They are diffed only at the file boundary, **increase-only** (a grown count — never a release or net-zero churn), and **after a settle** (the table is sampled twice across a drain of transient worker/scheduler/environment handles and the per-key minimum is taken), so only a genuinely never-released handle registers. The settle is skipped only when a spec left fake timers installed at file exit — the settle awaits real timers a still-installed fake clock would never fire, so it falls back to the unsettled snapshot (the lingering fake clock is itself flagged via the fake-timer-state diff). A change that reintroduces per-test active-resource diffing, or unconditionally removes the increase-only or settle guards, is a finding — it reintroduces non-reproducible false positives under the concurrent worker model.
- Only Node libuv handles are visible to the active-resource surface; environment-level timers (e.g. happy-dom's) are not Node handles and do not appear. The handle leaks the probe catches are Node handles — an unclosed server or socket, a `node:timers` interval, an fs watcher.
- The probe uses persistent collections (`immutable.Map`, `immutable.Set`) for snapshots — the snapshots are taken at one boundary and compared at the next, so structural sharing is the right shape and accidental mutation between snapshot and diff is impossible.
- The probe writes to `process.stderr`, not `console.error`. Stderr survives reporter buffering and integrates with CI log capture; `console.error` is intercepted by the runner's reporter and may be reformatted.

### Output line-shape contract

The probe's stderr output has five line shapes across three prefix families (`WARN`, `LEAK`, `RISK`), each with a documented meaning. The shapes are the **contract** with anyone reading the log — changing a shape silently breaks log scrapers, CI grep rules, and human pattern-matching.

- `[WARN <spec> <file-init>] …` — the probe could not resolve the spec's absolute path from `expect.getState().testPath`. Flags a runtime gap in the Jest-compat surface, **not** test-state pollution. Treat as a major-bump checklist signal.
- `[LEAK <spec> > <test>] …` — a per-test surface (`globalThis` keys, `process` listeners, fake-timer state) changed between the test's start and finish. Per-test scope; active resources are not included here.
- `[LEAK <spec> <file-exit>] …` — a per-test surface changed across the whole file lifetime, or a Node active-resource count grew (increase-only, settled). Per-file scope.
- `[RISK <spec> > <test>] concurrent test advanced fake timers — sibling tests share the clock` — a `.concurrent` test advanced the shared fake clock (Pattern B). Per-test, per-file-attributed.
- `[RISK <spec> <file-exit>] fake timers were advanced in this spec — …` — the spec file advanced the shared clock at some point. Per-file scope.

Reviewers must verify any change to the probe still emits these exact prefixes, in this order, with the spec label and (where applicable) the test name and the diagnostic detail. New line shapes get documented in the testing README before the probe ships them.

### `DEBUG_TEST_POLLUTION` gating

- The probe and the hijack both read `process.env.DEBUG_TEST_POLLUTION`. The flag flows from a runner `--mode` switch (`--mode=debug`) through the runner config's `env` block, **not** from an inline env-var prefix in a `package.json` script.
- The mode → env mapping lives in the runner config: `env: { DEBUG_TEST_POLLUTION: mode === "debug" ? "1" : "0" }`. Reintroducing an inline `DEBUG_TEST_POLLUTION=...` prefix in a script regresses the POSIX-vs-cmd portability the mode flag sidesteps — flag.
- Default-off in the standard test runs; on for the probed run. The flag is binary — no graduated levels.

### Pattern A vs Pattern B distinction

- **Pattern A** (`vi.setSystemTime` + `vi.useRealTimers()` cleanup) — installing a fixed clock without advancing it. Concurrency-safe: sibling concurrent tests converge on the same fixed instant. Permitted under concurrent execution. The hijack does **not** track Pattern A.
- **Pattern B** (`vi.useFakeTimers()` + an advance call) — advancing the shared fake clock. Breaks sibling concurrent tests' pending timers. The hijack tracks Pattern B by wrapping each advance entry point on the runner namespace.

Reviewers verify that any extension of the hijack tracks Pattern B entry points only. Pulling Pattern A into the tracked set is the regression to watch for.

### Cross-spec mock surface

- The runner is configured with `clearMocks: false`. The decision is deliberate: under parallel hooks plus concurrent tests, clearing shared mocks between tests would race siblings sharing the worker. The trade-off is that specs filter `mock.calls` by per-test identity (the context `expect`, or another per-test reference) at the call site.
- The infrastructure side of this contract is the **absence** of any setup-level mock clearing. Adding `clearMocks: true`, `mockReset`, or a `beforeEach` that resets shared mocks anywhere in the infra layer is a regression — the spec side relies on accumulation.
- `vi.mock` at module scope (used inside a spec) is the default for whole-file substitution. The infra layer does not provide a wrapper around `vi.mock` — wrapping it hides the substitution from anyone reading the spec.

### Jest-compat-surface reverify list

Some Vitest APIs ship for Jest parity rather than as first-class documented surface. The most-used in this codebase is `expect.getState().testPath`, which the probe and the setup hijack both depend on for per-file attribution.

On a Vitest major bump, reverify:

1. **Test-path injection** — `expect.getState().testPath` is still populated inside `beforeAll` / `beforeEach` / `afterAll`. Confirm with a probe-enabled run on a minimal spec.
2. **Absolute-path shape** — the field still holds the **absolute** path, not a relative or fragment form. The registry uses the path as a set key; a partial shape would silently fragment the dedupe.
3. **Mock-state semantics** — `clearMocks: false` still means "accumulate across tests within the worker." A change in the runner's default would silently flip the contract.
4. **Fake-timer adapter behaviour** — the entry points the hijack wraps still flush pending timers against the shared clock. New entry points added in a major bump need to be wrapped too; renamed entry points need the hijack updated in lockstep.

A failed reverify is a blocker — the probe must move to a runner-native equivalent **before** the bump lands.

### Codebase-agnostic naming

The probe label that specs pass to the leak tracker is a spec-author concern (the testing plan owns it). The **shape** of the line that consumes the label is an infra concern owned here — flag any change that interpolates the label into a position that breaks the documented `[<KIND> <label> > <test>]` grammar.

## When to run this plan

A PR that:

- Adds, modifies, or removes any file under `.configs/vitest/**` (setup module, fake-timer registry, helpers, helpers barrel)
- Touches the Vite-merge / setup-files / mode → env mapping side of `vitest.config.ts`
- Changes the `DEBUG_TEST_POLLUTION` gating mechanism, the mode-flag → env mapping, or the way scripts toggle the probe
- Adds or modifies a helper namespace exposed through the setup factory
- Lands a Vitest major bump (run the Jest-compat reverify list before merge)
- Adds infra-layer state outside the setup module (almost always a finding — confirm it cannot live in a closure inside the helper function instead)

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
