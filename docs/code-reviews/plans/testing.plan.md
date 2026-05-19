# Code Review Plan: Testing

## Scope

The project's **test suite and the infrastructure that makes specs runnable**. Concerns include:

- Spec files (`*.spec.ts`, `*.spec.tsx`) across every module
- The shared test setup that every spec implicitly loads
- Cross-spec mock surfaces (long-lived mocks reused by many specs)
- Scope helpers that wrap process-global and `globalThis`-global state for safe concurrent overrides
- The test-app factory that constructs a fresh server per test
- The pollution probe used to detect cross-test mock leaks
- The Vitest runner configuration that governs concurrency, isolation, coverage, and setup

The defining property: it exists to **verify behaviour**, not to provide it. A change here must not be confused with a change to production code — even when it lives close to the source. Test code only — the production source under test is reviewed under the matching area plan, not here.

Testing has a different review bar than production code. A bug in a spec shows up as a flaky test, a false-positive merge, or a regression that slips past CI; a bug in test infrastructure shows up as silent cross-test pollution that no single failing test can explain. The review focuses on **isolation under concurrency** and **adherence to the project's testing conventions**.

## Files currently in scope

These globs are operational hints for where the in-scope content currently lives — the conceptual scope above is canonical and survives a reorganisation.

- `app/**/*.spec.ts(x)` (every spec file, regardless of module)
- `.configs/vitest/setup.ts` (the shared setup that every spec loads)
- `.configs/vitest/helpers/**` (scope helpers, test-app factory, pollution probe, fastify helper)
- `.configs/vitest/mocks/**` (cross-spec mock surfaces)
- `vitest.config.ts` (runner config: pool, isolation, concurrency, setup files, coverage)
- `tsconfig.test.json` (only the parts that affect spec compilation — paths the specs rely on)

## Required skills

| Skill                     | Why                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                                               |
| `vitest`                  | Vitest API surface, mock strategy, concurrency model, fake-timer semantics                                        |
| `typescript-magician`     | Spec types, `expectTypeOf`, asymmetric matchers, generic test helpers                                             |
| `fastify-best-practices`  | Required when a spec uses the test-app factory or otherwise constructs a Fastify instance under test              |
| `node`                    | Required when a spec touches Node built-ins, signal handling, child processes, process-scope, or globalThis-scope |
| `tdd`                     | Optional: when the change is test-first / red-green-refactor (pair the skill, don't require it for review)        |

## Pair with the project's testing documentation

`docs/testing/README.md` is the **project doc that wins over the upstream Vitest skill** wherever the two diverge. Read it first. It captures decisions the upstream skill cannot know about: file layout, the frozen test-data object's shape, scope helpers, test-app factory, assertion style, concurrency rules, naming grammar.

Every review focus below either restates a project-doc rule or sharpens it for review use.

## Review focus

### File layout

- Spec follows the canonical section order: imports → hoisted mocks → utility destructure → setup destructure → scope handles → pollution probe registration → subject destructure → the spec's frozen test-data object → the module-level mock-reset array (when present) → spec-local helpers → `describe` blocks
- Imports follow the grouping convention: `@configs` aliases, then npm/node + `vitest`, blank line, then `@shared` aliases, blank line, then local `./` paths; `import type` stays separate from value imports
- Two-level `describe` nesting: outer is the namespace/class name, inner is the function under test; both labels are referenced by name, not paraphrased

### `TEST_DATA` discipline

- Exactly **one** `const TEST_DATA = { ... } as const;` per spec — never multiple
- Keys are **strictly alphabetical**, scalars and getters and case arrays interleaved by key name
- Outer `as const` is sufficient; nested arrays do not repeat `as const`
- Mutable fixtures (a `Map`, `Set`, or any value whose mutation must not bleed across tests) use **getters**, not direct fields
- Case arrays carry the `_CASES` suffix; each case object has a `name` field as the first key (used as `it()` description)

### Test descriptions

- Every `it(...)` name starts with `should `, third-person present tense
- Sibling tests sharing a structural shape use the **same sentence skeleton** for positive and negative forms (e.g. `"...for a value present in the set"` ↔ `"...for a value absent from the set"`)
- The pollution probe label is the spec file's stem in kebab-case, without the `.spec.ts` suffix

### Parameterisation vs separate tests

- Cases sharing scaffolding and differing only in inputs/expected output → lift into `_CASES`, iterate with `forEach(({ name, ... }) => it(name, ...))`
- Cases that differ structurally (return value vs thrown error; single-call vs multi-call mock setup) stay as **separate `it` blocks** — do not force parameterisation across structural boundaries

### Mocks — cross-spec vs per-spec

- Cross-spec mocks live in the shared setup module; per-spec mocks are hoisted at the top of that single spec
- `vi.hoisted` declares spy functions before any imports resolve; spec destructures the names it needs from the hoisted object without extra indirection
- `vi.mock` factories that need to preserve real exports use `importOriginal` and spread, then override only the targeted exports
- Factories that fully replace a module skip `importOriginal` and return the replacement directly

### Concurrency safety

The project runs tests **concurrently within a file**, and files run in parallel. Every mock and every piece of test state must be designed so concurrent tests cannot collide on it.

- **Callback-capture patterns** — do not rely on FIFO `mockImplementationOnce` queues; await order is not guaranteed to match the queue order. Use a per-test identity (e.g. a logger reference unique to each test's app) keyed into a registry and looked up inside a single persistent `mockImplementation`
- **Process-global / globalThis-global state** (`process.exit`, `process.kill`, ambient globals) must be wrapped by the project's `AsyncLocalStorage`-backed scope helpers; tests obtain a `run(impl, fn)` handle and execute their body inside `await run(...)` with their own impl active
- **Fake timers are process-global.** Tests that advance the same fake clock simultaneously can interfere. Assert on "did the promise resolve before X" rather than measuring elapsed wall-clock time. Tests that depend on fake timers must establish them themselves — never inherit from a sibling test

### Resetting mocks

- `clearMocks` is globally enabled — every spy's `mock.calls`, `mock.instances`, `mock.results` reset per test
- Implementations and return-value queues are **not** wiped by `clearMocks`. **Prefer `mockResolvedValueOnce` / `mockReturnValueOnce` / `mockImplementationOnce`** for per-test setup — the `Once` queue is self-cleaning and needs no reset hook, which keeps specs free of cleanup boilerplate. Reach for the module-level mock-reset array + the test-app factory's reset-on-cleanup option for mock queues (or `mockReset()` inside `onTestFinished` when no test-app is involved) only when a queued behaviour genuinely outlives a single call, or when the spec installs a persistent `mockImplementation` that must be unwound between tests
- Do **not** call `mockReset()` on a shared singleton from inline cleanup mid-test under concurrent execution — it wipes state other concurrent tests still depend on

### Test-app factory

- Tests that need a Fastify instance use the project's shared test-app factory rather than constructing one inline; the factory is responsible for per-test isolation and cleanup registration
- The factory builds a fresh app per test (logger disabled) and registers cleanup with `onTestFinished` — no manual `app.close()` calls
- The factory's reset-on-cleanup option for mock queues is the supported channel for queue-reset cleanup; its free-form cleanup-callback option is for one-off restore work

### Assertion style

The three canonical forms are applied uniformly:

| Intent                     | Form                                                                  |
| -------------------------- | --------------------------------------------------------------------- |
| Call count                 | `expect(spy.mock.calls.length).toBe(N)`                               |
| Call arguments — any call  | `expect(spy.mock.calls).toContainEqual([...args])`                    |
| Call arguments — last call | `expect(spy).toHaveBeenNthCalledWith(spy.mock.calls.length, ...args)` |

The wrapper matchers `toHaveBeenCalled`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith` are **intentionally avoided**. Flag uses of those wrappers — they read further from the spy's actual state and hide inconsistencies.

For rejected promises: `await expect(fn()).rejects.toBeInstanceOf(ErrorClass)` or `.rejects.toBe(errorInstance)`. For asymmetric matchers: prefer the test-context `expect` from the destructured callback parameter; use a `vitest`-imported static `ExpectStatic` parameter when matchers must be built inside the spec's test-data factory functions.

### Type-level assertions

- `expectTypeOf` co-located with the runtime assertion inside the **same `it` block** when both behaviours matter for the function under test
- Type-only assertions live alongside the runtime check they accompany — they are not collected into a separate suite

### Coverage

- Coverage is informational, not a merge gate
- Coverage exclusions list (`**/*.constant.ts`, `**/*.d.ts`, `**/*.spec.{ts,tsx}`, `**/*.type.ts`, `**/index.ts`) should reflect intent — flag any inclusion that smuggles a barrel or type file into the coverage report, or any exclusion that conceals untested production logic

### Runner configuration

- `pool`, `isolate`, `sequence.concurrent`, `sequence.shuffle` decisions are reviewed for their concurrency implications — every spec must hold up under the chosen settings, not just the default
- `setupFiles` order matters when multiple files register hooks; review the order whenever a new setup file is added
- `environment` choice (e.g. `happy-dom` vs `jsdom` vs `node`) is reviewed against the kinds of specs that run under it — flag mismatches (server-only suites loading a DOM globals provider without need)
- `globals: false` means every `describe`/`it`/`expect`/`vi`/hook must be imported explicitly — flag any spec relying on globals
- Path-alias resolution for specs (e.g. via `resolve.tsconfigPaths`) matches the production resolver — divergence here means a spec can pass while the same import path fails at runtime

### Security and supply chain (within the test surface)

- No secrets in spec bodies, fixtures, or the spec's frozen test-data object
- External-fetch mocks return shapes the production code actually accepts — flag drift between the mock's response shape and the parser's expectation
- Tests that spawn child processes or touch the filesystem do so under a sandbox helper, not via raw `child_process.spawn` / `node:fs` calls — flag unsandboxed direct calls

### Helper hygiene

- Each helper under `.configs/vitest/helpers/**` has one concern (one scope wrap, one factory, one probe)
- Helpers are exported via a namespace object (`<Concept>Helper = { fn1, fn2 }`) matching the project convention; the namespace name is the PascalCase form of the kebab-case file name (`<concept>.helper.ts` → `<Concept>Helper`)
- Helpers are pure where they can be — when they wrap mutable global state, the mutation is contained to an `AsyncLocalStorage` scope, not a module-level variable

### Mock surface hygiene

- A cross-spec mock that only one spec actually consumes belongs as a per-spec mock, not in the shared setup
- A per-spec mock that has been duplicated across three or more specs belongs in the shared setup
- Every mock has at least one spec that asserts on its behaviour; otherwise it's a vestigial spy

## When to run this plan

A PR that:

- Adds or modifies any `*.spec.ts(x)` file
- Touches `.configs/vitest/setup.ts`, any helper under `.configs/vitest/helpers/**`, or any mock under `.configs/vitest/mocks/**`
- Modifies `vitest.config.ts` (runner config, concurrency, isolation, coverage, setup files, environment)
- Adjusts `tsconfig.test.json` in ways that affect spec compilation (paths, lib, includes, exclude)
- Edits `docs/testing/README.md` (run this plan **and** the documentation plan)

Even when only a single spec moves, the concurrency rules and the shared-vs-per-spec mock partition apply uniformly — a spec that runs in isolation may still pollute peers under the project's concurrent pool.

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule). Test-infrastructure findings often warrant top-level review comments — a concurrency bug rarely maps to a single line.
