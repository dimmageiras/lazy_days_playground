# Code Review Plan: Testing

## Scope

The project's **spec surface** — the specs themselves and the conventions an author follows when writing one. The defining property: anything whose failure mode is "specs pass locally but lie about correctness, or fail unpredictably in CI" **at the spec-author's seat**. Concerns include:

- Spec file layout (imports → setup destructure → leak-tracker → unit-under-test destructure → frozen `TEST_DATA` → `describe`)
- The `TEST_DATA` shape — frozen `as const`, scoped to one spec, table-driven cases
- Assertion style — context-local `expect`, nested `describe`-callback `it`, specific matchers
- Concurrency posture from the spec's seat — concurrency-by-default, no `.sequential`, the Pattern A vs Pattern B clock rule
- Mock strategy from the spec's seat — using the shared mock surface, per-test identity filtering
- Naming grammar — files, suites, test names, fixture keys
- Probe usage from the spec's seat — calling the leak tracker with a label

The test-infrastructure surface beneath the specs (the setup factory, the fake-timer registry, the probe helpers, the runner-side bindings, the Jest-compat reverify list) is owned by [`./test-infra.plan.md`](./test-infra.plan.md). This plan stays at the spec author's seat; that plan owns the infrastructure side.

Project-specific testing conventions live in [`../../testing/README.md`](../../testing/README.md). That README is canonical; this plan reviews against it.

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement.

- `**/*.spec.{ts,tsx}` (every spec, regardless of location)
- `tsconfig.test.json` (test-only TypeScript compiler options — the spec author's reachable types and lib)
- Test-related entries in `package.json` `scripts` (the spec author's runner invocations; the mode-flag → env mapping that backs them is owned by the test-infra plan)

The runner config, the setup module, the helper layer, and the fake-timer registry are owned by [`./test-infra.plan.md`](./test-infra.plan.md).

## Required skills

| Skill                     | Why                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                                                   |
| `vitest`                  | Upstream runner reference — API surface, mock semantics, lifecycle hooks, context-scoped vs module-scoped pulls       |
| `typescript-magician`     | Per-test typed context, fixture-shape inference, `as const` discipline on `TEST_DATA`, generic test-data table shapes |

The first criterion the reviewer applies: where the upstream `vitest` skill and the project testing README diverge, **the README wins**. The skill teaches the API; the README teaches how this codebase uses it.

## Review focus

### Spec file layout

- Specs live next to source, not under a separate top-level test tree.
- The spec suffix is `.spec.ts(x)`; the runner glob targets only that suffix.
- Specs open in this fixed order: **imports → setup-helper destructure → leak-tracker call → unit-under-test destructure → frozen `TEST_DATA` → `describe`**. Reordering these lines is a finding even when the spec still runs — the order is what makes a spec readable cold.
- Module-level imports are reserved for symbols the test context does not expose. Lifecycle hooks (`beforeAll`, `beforeEach`, `afterAll`, `afterEach`) and the runner utility object have no context-scoped form by design — import them from the runner module. Any other module-level pull from the runner is usually a sign the context-scoped path was overlooked.
- Specs do **not** import helpers directly from the helpers folder — they go through the project setup factory's zero-arg call and destructure the helper bundle from its return value. The factory's identifier is a placeholder in this plan; the project setup module owns the actual identifier.

### `TEST_DATA` shape

- Every spec that uses inputs, fixtures, or table-driven cases collects them into a **single** `TEST_DATA` object frozen with `as const`.
- Keys are `SCREAMING_SNAKE_CASE` and describe the case group (`<GROUP>_CASES`) or the named value (`<NAME>_<UNIT>`).
- Table-driven cases are arrays of objects shaped `{ name, …case-specific inputs, expected? }`. The `name` is what the runner's `it` receives. Per-case input keys are named after the parameter under test (`value` for predicates, `input` for transforms, `ms` for durations, etc.). An `expected` key is included whenever the spec asserts an exact value; predicates that assert `true`/`false` may omit it.
- No mutation, no computed values that close over module state — everything inside `TEST_DATA` must be inspectable at a glance.
- `TEST_DATA` is scoped to **one** spec. No cross-spec sharing; a fixture two specs need belongs in a fixture helper, not in a shared `TEST_DATA`.

### Suite shape and assertion style

- Top-level `describe` block per public surface (one per exported namespace, helper, or component).
- Nested `describe` per method or behaviour. Pull the runner's `it` from the parent `describe` callback (`describe("…", (it) => { it(…) })`) rather than importing it at module scope — that pattern is what the runner exposes; reaching past it loses the per-block context.
- Destructure `expect` from the test context (`async ({ expect }) => …`) rather than the module-level import. The context-local `expect` carries per-test identity, which is required because automatic mock clearing is off by design.
- The same rule applies to anything else the test context exposes (e.g. `task`, `onTestFinished`, `annotate`).
- Prefer specific matchers (`toBe`, `toEqual`, `toBeInstanceOf`, `toBeGreaterThanOrEqual`) over generic `truthy`/`falsy` checks.
- No snapshot tests by default; introduce one only when the assertion's value is genuinely opaque and the snapshot is small.

### Concurrency posture (from the spec author's seat)

- The runner runs in-file tests concurrently by default. **New specs are not `.sequential` unless they have a documented reason to be.** A `.sequential` modifier appears in the spec only if its presence is justified at the call site (inline comment, ticket reference, or convention note).
- File ordering and in-file test ordering are randomised. A spec that passes only under a particular order is broken.
- The shared fake clock is worker-global. Advancing it from a concurrent test (`vi.useFakeTimers()` followed by an advance call) breaks sibling tests' pending timers. Installing a fixed clock (`vi.setSystemTime` + `vi.useRealTimers()` cleanup) is concurrency-safe — sibling tests converge on the same instant. Fix Pattern B by hoisting the clock to `beforeAll`/`afterAll`, or by isolating the time-dependent behaviour from the shared clock entirely (e.g. spy on the underlying scheduler primitive and drive the captured callback by hand).
- The infrastructure side (the registry that tracks Pattern B advances and the probe lines that flag them) is owned by [`./test-infra.plan.md`](./test-infra.plan.md).

### Mock strategy (from the spec author's seat)

- Automatic mock clearing is **off** by design. Specs that touch mocks must filter `mock.calls` by per-test identity (the context `expect`, or another per-test reference) rather than assuming a fresh mock at each test. A spec that asserts on `mock.calls.length` without per-test filtering accumulates across siblings and produces flaky CI signal.
- `vi.mock` at module scope is the default for whole-file substitution. `vi.spyOn` on shared modules requires an `afterEach` restore — the absence of automatic clearing turns a forgotten restore into a cross-test leak.
- The infrastructure that backs this contract (the `clearMocks: false` runner setting and the consequences for the helper layer) is owned by [`./test-infra.plan.md`](./test-infra.plan.md).

### Probe usage (from the spec author's seat)

- Every spec calls the leak tracker once at the top of the file, passing a **label** that names the spec for log output. The label is a short identifier — typically the spec's subject (`<subject>.<kind>`), not a sentence.
- The leak tracker is the only place the probe touches the spec. Specs do not register their own state-diff hooks, do not write to stderr, and do not consult the registry directly.
- A green probed run is the contract. Any `[WARN]`, `[LEAK]`, or `[RISK]` line on stderr is a real signal — chase it; do not suppress it.
- The probe is gated by a single environment variable that the runner config maps from a mode flag. A spec that reads or writes the env variable directly is a finding — the gating is the runner's responsibility.

### Naming grammar

- Spec file names mirror their subject: `<subject>.<kind>.spec.ts` next to `<subject>.<kind>.ts` (where `<kind>` is `helper`, `route`, `type`, etc.).
- Suite names describe the unit, not the file. The top-level `describe` carries the public surface; nested `describe` carries the method or behaviour.
- Test names start with a verb in `it`'s argument (`should …`, `returns …`, `throws …`). The runner accepts any string; the convention is what makes the failure log readable.
- Fixture keys inside `TEST_DATA` follow the `SCREAMING_SNAKE_CASE` rule above. Disambiguate ambiguous shorthands (`TENTH` could be ordinal or fractional; `ONE_TENTH` is unambiguous).
- Mock identifiers in a spec name the **substitute**, not the substitution mechanism — `<modulePascalCase>Mock` is preferable to `<modulePascalCase>Spy` unless the substitution is in fact a spy on a real method.

### Spec-side scripts

- The probed run is invoked via the runner's `--mode` flag (`--mode=debug`); the default and coverage runs leave the probe off via the config's mode → env mapping. A script that reintroduces an inline `DEBUG_TEST_POLLUTION=...` prefix is a regression — flag.
- The infra side of this contract (the mode → env mapping itself) is owned by [`./test-infra.plan.md`](./test-infra.plan.md).

### TypeScript test config

- `tsconfig.test.json` extends the base and relaxes only what the test surface needs (looser-than-source `lib`, additional global types for the runner). Anything stricter belongs back in the base.
- Path aliases match the runtime config so a spec resolving an alias means the same thing the source does. The cross-surface alias-coherence invariant is owned by [`./build-configs.plan.md`](./build-configs.plan.md); a spec that imports through an alias absent from the `paths` block is a finding here as well.

## When to run this plan

A PR that:

- Adds or modifies any `*.spec.{ts,tsx}` file
- Adds or changes a script in `package.json` whose name starts with `test`
- Changes the test TypeScript config (`tsconfig.test.json` or equivalent)
- Adds a dependency under the test pool from the spec-author's seat (assertion-extension libraries, fixture libraries)

For PRs touching the runner config, the setup module, the helper layer, the fake-timer registry, or the probe internals, run [`./test-infra.plan.md`](./test-infra.plan.md) instead — that plan owns the infrastructure side. For PRs spanning both seats, run both plans.

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
