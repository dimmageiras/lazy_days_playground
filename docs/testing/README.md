# Testing

Conventions every spec in this project follows. Read top to bottom before writing a new spec, or use it as a checklist when reviewing one.

## Runner and environment

- **Vitest** is the test runner. Vite-native, ESM-first, TypeScript via type-stripping (no separate build).
- **happy-dom** is the test environment — a lightweight DOM implementation, picked over `jsdom` for startup speed. DOM globals are present even in server-leaning specs; opt into them rather than mocking them away.
- **Globals are off.** `describe`, `it`, `expect`, `vi`, hook helpers — all imported explicitly from `vitest`. The TypeScript types are configured to flag missing imports loudly.

## File layout per spec

A single canonical order applies to every spec. The order is:

1. **Imports** — grouped as `@configs` aliases, then npm/node, then `vitest`, blank line, then `@shared` aliases, blank line, then local `./` paths. `import type` stays separate from value imports.
2. **Hoisted mock declarations** (when the spec mocks any module): a `vi.hoisted` block creating the spy functions, followed by `vi.mock(...)` factories that wire them in.
3. **Utility destructure** (when a runtime utility is referenced inside `TEST_DATA`): e.g. a cast helper.
4. **Setup destructure** — a single call to the project's setup factory returning every helper, scope, and shared mock the spec needs. Destructured keys are alphabetical.
5. **Scope handles** — created from any process-level or globalThis-level scope helpers the spec uses.
6. **Pollution probe registration** — one call that hooks an after-each which logs end-of-test state when the debug flag is set.
7. **Subject destructure** — pulling the named functions out of the helper or module under test.
8. **`TEST_DATA`** — a frozen object with strictly alphabetical keys (see below).
9. **RESET_MOCK_ARRAY** — when the spec needs to reset mocks per test, the array of mocks lives in one module-level const, not inlined per test.
10. **Spec-local helpers** — factory functions like `createFakeX`, signal-shape builders, fake instance constructors, capture registries.
11. **`describe` blocks** — two-level nesting: outer is the namespace/class name, inner is the function under test. Inner uses the callback-receives-`it` form.

The order is the same regardless of whether each section is present.

## TEST_DATA convention

- A single `const TEST_DATA = { ... } as const;` per spec — never multiple.
- **Strictly alphabetical** by key, regardless of value type. Scalars, getters, and case arrays interleave naturally by their key name. The outer `as const` is sufficient; do not repeat `as const` on nested arrays.
- **Parameterized case arrays** carry a `_CASES` suffix and contain objects whose first field is `name` (the `it()` description). Other fields describe the case-specific inputs and expectations.
- Getters are used for **mutable fixtures** so each test reads a fresh instance (e.g. a `Map` or `Set` whose mutation must not bleed across tests).

## Test description grammar

- Every `it(...)` name starts with `should `, third-person present.
- Sibling tests sharing a structural shape use the same sentence skeleton. If one test in the file uses `"should return X for a value present in the set"`, its negation should be `"should return Y for a value absent from the set"` — not a different skeleton like `"should return Y if the value is not in the set"`.
- Outer `describe` is the namespace (e.g. the helper class). Inner `describe` is the function name. Both labels are referenced by name, not paraphrased.
- The label passed to the pollution probe is the same kebab slug as the spec file's stem (without the `.spec.ts` suffix).

## Parameterization

When two or more tests share scaffolding and differ only in inputs and expected output:

- Lift the variations into a `_CASES` array inside `TEST_DATA`.
- Iterate with `TEST_DATA.X_CASES.forEach(({ name, ... }) => it(name, ...))`.
- Keep tests **separate** (not parameterized) when they differ structurally — for example, when one asserts a return value and another asserts a thrown error, or when one path takes a single-call mock setup and another requires multi-call queuing.

## Mocks

The project uses two distinct mock surfaces:

| Surface              | Lives in                                               | Why                                                                                                                       |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Cross-spec mocks** | A shared setup module that every spec implicitly loads | Used by many specs (e.g. external HTTP, lifecycle libraries, shared utility helpers). One source of truth prevents drift. |
| **Per-spec mocks**   | Hoisted at the top of a single spec                    | Used only by that spec — typically sibling modules being mocked to isolate the unit under test.                           |

Within either surface:

- **`vi.hoisted` declares the spy functions** before any imports resolve, so module factories can reference them. Destructure the names you need from the hoisted object — do not introduce extra indirection.
- **`vi.mock` factories** that need to preserve some of the real module use the `importOriginal` pattern: load the real module, spread it, then override only the specific exports being mocked. Factories that fully replace the module (e.g. external transport clients) skip `importOriginal` and return the replacement directly.
- **Per-test isolation matters more than queue order.** Avoid relying on FIFO consumption of `mockImplementationOnce` for callback-capture patterns under concurrent execution — the await order is not guaranteed to match the queue order. When per-test state is needed, key a registry off a per-test identity (such as a logger reference unique to each test's app) and look it up inside a single persistent `mockImplementation`.

## Resetting mocks

- **`clearMocks` is enabled globally** — every spy's `mock.calls`, `mock.instances`, `mock.results` reset before each test runs. Implementations and return-value overrides are **not** wiped.
- For shared singleton mocks that need their implementation/return-value queue reset between tests, pass the module-level mock-reset array to the test-app factory's `mocksToReset` option, or call `mockReset()` on the array elements inside `onTestFinished` when no test-app is involved.
- Do **not** call `mockReset()` on a shared singleton from inline cleanup mid-flight under concurrent execution — it wipes state other concurrent tests are still depending on.

## Scope helpers

Two scope helpers wrap process-global and globalThis-global state so tests can override it safely:

- **Process-method scope** — wraps a function on `process` (e.g. `exit`, `kill`) and routes calls through an `AsyncLocalStorage`-backed dispatcher. Tests obtain a `run(impl, fn)` handle and execute their body inside `await run(...)` with the test's specific impl active.
- **GlobalThis scope** — wraps a property on `globalThis` so reads and writes are scoped to the calling async context. Same `run(initial, fn)` shape.

Both are safe under concurrent execution because the scope is async-local, not module-global.

## Test-app factory

Tests that need a Fastify instance use the project's test-app factory, which receives an `onTestFinished` handle plus an options bag. The factory:

- Constructs a fresh app per test (logger disabled).
- Registers the cleanup automatically with `onTestFinished` — no manual `app.close()` calls.
- Accepts a `mocksToReset` option (array of spies to `mockReset` on cleanup) and a free-form `resetFn` for one-off restore work (e.g. restoring a stubbed `process.platform`).

Specs that don't need an app (e.g. testing a pure HTTP-client wrapper) skip the factory and reset shared mocks manually inside `onTestFinished`.

## Assertion style

Three families of assertion, applied uniformly:

| Intent                         | Form                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| **Call count**                 | `expect(spy.mock.calls.length).toBe(N)`                               |
| **Call arguments — any call**  | `expect(spy.mock.calls).toContainEqual([...args])`                    |
| **Call arguments — last call** | `expect(spy).toHaveBeenNthCalledWith(spy.mock.calls.length, ...args)` |

The wrapper matchers `toHaveBeenCalled`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith` are intentionally avoided — each has a direct `.mock.calls` equivalent that reads closer to the spy's actual state and surfaces inconsistencies faster.

For **rejected promises**: `await expect(fn()).rejects.toBeInstanceOf(ErrorClass)` or `.rejects.toBe(errorInstance)`.

For **asymmetric matchers** (`expect.any(Number)`, `expect.objectContaining({...})`): use the test-context `expect` from the destructured callback parameter when matchers appear inside the test body. Use a `vitest`-imported static `ExpectStatic` parameter when matchers must be built inside `TEST_DATA` factory functions.

## Type-level assertions

Use `expectTypeOf` for compile-time checks. Co-locate them with the runtime assertion inside the same `it` block when both behaviours matter for the function under test.

## Concurrency

- **Files run in parallel.** Each test file is an island for scheduling purposes.
- **Tests within a file run concurrently.** This is project-wide — there is no per-describe opt-out in use anywhere.
- The implication: every mock must be designed so concurrent tests **cannot collide** on it.
  - For callback-capture patterns, key a registry off a per-test identity (e.g. a logger reference unique to each test's app) so concurrent lookups never cross paths. Avoid FIFO `mockImplementationOnce` queues — the await order is not guaranteed to match the queue order.
  - For process-global / globalThis-global state (`process.exit`, `process.kill`, ambient globals), use the project's `AsyncLocalStorage`-backed scope helpers and `run(impl, fn)` wrappers so each test's override is isolated to its async context.
  - For shared spies that need their queues cleared, register `mocksToReset` with the test-app factory so cleanup is bound to the right test's lifecycle.

## Fake timers

- Enable inside the test (or via `beforeEach` for the enclosing describe) with `vi.useFakeTimers()`; restore with `vi.useRealTimers()` in `afterEach` or `onTestFinished`.
- The fake clock is process-global. Because concurrent execution is project-wide, **tests that advance the same fake clock simultaneously can interfere.** Where this matters, redesign the test to avoid asserting on absolute resolution timing — assert on the boolean "did the promise resolve before X" rather than measuring elapsed time.
- Tests that explicitly assert resolution-or-not-resolution must establish fake timers themselves; do not rely on a sibling test having left fake timers in place.

## Pollution debugging

A pollution probe is registered per spec via `trackEndStateAfterEach(label)`. When the project's debug flag is set, it logs the end-of-test mock-call counts for every spy in the shared mock set, prefixed with the spec label. Useful when investigating cross-test mock leaks under non-isolated execution.

## Coverage

- Coverage is scoped to the production source root. Spec files, type definitions, barrel files, and the like are excluded.
- Coverage is informational, not a blocker. Use it to find paths the spec suite misses, not as a merge gate.

## When to deviate

The conventions above are starting points. Deviation is acceptable when the alternative is genuinely simpler **for that specific case** — e.g., a spec testing a function that takes no dependencies might skip `TEST_DATA` entirely. Codify a new convention only when a deviation recurs across three or more specs.
