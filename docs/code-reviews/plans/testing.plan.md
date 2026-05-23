# Code Review Plan: Testing

## Scope

The project's test surface and its supporting infrastructure — specs, runner configuration, setup files, shared helpers, fixtures, and the diagnostics tooling that protects them. The defining property: anything whose failure mode is "specs pass locally but lie about correctness, or fail unpredictably in CI." Concerns include:

- The runner contract — worker model, concurrency, isolation, mock retention
- Spec authoring conventions — file layout, naming, data shape, assertion style
- Shared test infrastructure — helpers as stateless dispatchers, setup composition
- Diagnostics — pollution probing (and any future smoke flow that exercises it)
- Coverage configuration — what is included, what is excluded by convention

Project-specific testing conventions live in [`../../testing/README.md`](../../testing/README.md). That README is canonical; this plan reviews against it.

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement.

- `**/*.spec.{ts,tsx}` (every spec, regardless of location)
- `vitest.config.ts` (runner contract — worker mode, concurrency, coverage)
- `.configs/vitest/setup.ts` and any sibling setup files
- `.configs/vitest/helpers/**` (the stateless-dispatcher helper layer)
- `tsconfig.test.json` (test-only TypeScript compiler options)
- Test-related entries in `package.json` `scripts`

## Required skills

| Skill                     | Why                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `code-review-and-quality` | Multi-axis baseline                                                                                                                  |
| `vitest`                  | Upstream runner reference — API surface, mock semantics, lifecycle hooks                                                             |
| `node`                    | Test infra that touches Node-only APIs (process events, active resources, env-gated behaviour, native modules under the worker pool) |
| `typescript-magician`     | Per-test typed context, generic helpers over the test surface, `as const` discipline on fixture data                                 |

The first criterion the reviewer applies: where the upstream `vitest` skill and the project testing README diverge, **the README wins**. The skill teaches the API; the README teaches how this codebase uses it.

## Review focus

### Worker model and concurrency

- Worker isolation is off by design — helpers and any module-level state persist for the worker. Any new module-level state in `.configs/vitest/**` is a regression unless it is genuinely worker-scoped infrastructure with a deliberate decision recorded.
- Concurrency-by-default is on. New specs are `.concurrent` unless they have a documented reason to be sequential.
- File ordering and in-file test ordering are randomised. Specs that pass only under a particular order are broken.
- No advancing the shared fake clock from a `.concurrent` test — fake clocks are worker-global. Installing a fixed clock with `vi.setSystemTime` and restoring real timers in cleanup is permitted (sibling tests converge on the same instant); advancing the clock breaks siblings' pending timers. Fix by hoisting the clock to a `beforeAll` / `afterAll` pair, or by isolating the time-dependent behaviour from the shared clock entirely — e.g. spy on the underlying scheduler primitive and drive the captured callback by hand, so the test never advances any worker-global clock.

### Spec conventions

- Specs live next to source, not under a separate top-level test tree.
- The spec suffix is `.spec.ts(x)`; the runner glob targets only that suffix.
- Specs open in this order: imports → setup-helper destructure → leak-tracker → unit-under-test destructure → frozen `TEST_DATA` → `describe`.
- `TEST_DATA` is a single object frozen with `as const`. Keys are `SCREAMING_SNAKE_CASE`; table-driven cases are arrays of objects shaped `{ name, …case-specific inputs, expected? }`.
- Suites use nested `describe` blocks per public method; `it` comes from the parent `describe` callback (`describe("…", (it) => { it(…) })`), not the module-level import. The runner exposes a block-scoped `it`; reaching past it loses per-block context.
- Assertions destructure `expect` from the test context (`async ({ expect }) => …`) rather than the top-level `vitest` import, so per-test identity flows through.

### Mock hygiene

- Automatic mock clearing is off by design. Specs that touch mocks must filter `mock.calls` by per-test identity (the context `expect`, or another per-test reference) rather than assuming a fresh mock at each `it`.
- `vi.mock` at module scope is the default for whole-file substitution. `vi.spyOn` on shared modules requires an `afterEach` restore — the absence of automatic clearing turns a forgotten restore into a cross-test leak.

### Helper contract (stateless dispatchers)

- Every helper exports a frozen namespace object whose entries are functions. The namespace name is the PascalCase form of the kebab-case file name.
- Each helper function captures any state in closures inside its body. Module-level state is forbidden in this layer — it persists for the worker and leaks across files.
- Lifecycle hooks (`beforeAll`, `beforeEach`, `afterAll`) are registered **inside** the helper function, not at module scope. A module-scope hook attaches once per worker, not once per spec invocation.

### Diagnostics — the pollution probe

- A single environment variable (`DEBUG_TEST_POLLUTION`) gates probe output. Default-off in `test` / `test:cov`; on for `test:cov:debug` (and any future smoke flow when added).
- A green probed run is the contract. Any `[WARN]`, `[LEAK]`, or `[RISK]` line on stderr is a real signal — chase it; do not suppress it. `[WARN]` flags a runtime gap in the Jest-compat surface the probe relies on; `[LEAK]` flags state that survived where it shouldn't; `[RISK]` flags worker-global clock advances under concurrent execution.
- The probe diffs `globalThis` keys, `process` event listeners, active resources, and fake-timer state. New global mutation in test or production code shows up here first.

### Smoke flow (when present)

A smoke flow is **not currently configured**; this section applies once a smoke script and matching config are added. Triggers below stay live so the plan picks up the surface as soon as it lands.

- The smoke script invokes a curated config under the test-helpers tree with verbose reporting and the probe enabled. Flag absence if a referenced smoke script has no on-disk config.
- The smoke flow's purpose is signal without full-suite cost — keep the curated subset narrow.

### Coverage configuration

- Coverage `include` targets source paths; `exclude` removes spec files, type-only files, constants files, and barrel `index.ts` files (the latter on the project-wide convention that barrels are pure re-exports).
- Report-on-failure is on so a red CI still produces a coverage artefact for triage.
- The coverage tool reads test results via the runner; no parallel test runner is configured for coverage.

### Scripts

- Test scripts in `package.json` toggle the probe via Vitest's `--mode` flag (e.g. `--mode=debug`), and the Vitest config maps the mode to `test.env.DEBUG_TEST_POLLUTION`. This sidesteps the POSIX-vs-cmd env-var-prefix sharp edge — flag a regression that reintroduces an inline `DEBUG_TEST_POLLUTION=...` prefix in a script.
- Each script's purpose is distinct: a default run, a coverage run, a probed coverage run, and (when added) a smoke run. Duplication or near-duplicates without a stated reason are review findings.

### TypeScript test config

- `tsconfig.test.json` extends the base and relaxes only what the test surface needs (looser-than-source `lib`, additional global types for the runner). Anything stricter belongs back in the base.
- Path aliases match the runtime config so a spec resolving an alias means the same thing the source does.

## When to run this plan

A PR that:

- Adds or modifies any `*.spec.{ts,tsx}` file
- Touches the Vitest config, setup file, or any module under the test-helpers tree
- Adds or changes a script in `package.json` whose name starts with `test`
- Introduces a new smoke or scope-specific runner config
- Changes the test TypeScript config
- Adds a dependency under the test pool (mock libraries, fixture libraries, type packages for the runner)

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
