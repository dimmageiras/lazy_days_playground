# Test Infrastructure — Review Findings

Reviewed against [`../plans/test-infra.plan.md`](../plans/test-infra.plan.md), with the project testing conventions in [`../../testing/README.md`](../../testing/README.md) as canonical. Skills invoked: `code-review-and-quality` (multi-axis baseline), `vitest` (setup-file lifecycle, mock/fake-timer semantics, Jest-compat surface, mode→env mapping), `typescript-magician` (the `UnionToIntersection` factory return, `as const` literal preservation).

Files in scope (all read at current state):

- [`.configs/vitest/setup.ts`](../../../.configs/vitest/setup.ts)
- [`.configs/vitest/constants/shared-test-data.constant.ts`](../../../.configs/vitest/constants/shared-test-data.constant.ts)
- [`.configs/vitest/fake-timer-registry.ts`](../../../.configs/vitest/fake-timer-registry.ts)
- [`.configs/vitest/function-wrap.ts`](../../../.configs/vitest/function-wrap.ts)
- [`.configs/vitest/spy-registry.ts`](../../../.configs/vitest/spy-registry.ts)
- [`.configs/vitest/mocks/shared.mock.ts`](../../../.configs/vitest/mocks/shared.mock.ts)
- [`.configs/vitest/helpers/index.ts`](../../../.configs/vitest/helpers/index.ts)
- [`.configs/vitest/helpers/state-probe.helper.ts`](../../../.configs/vitest/helpers/state-probe.helper.ts)
- [`.configs/vitest/helpers/fastify.helper.ts`](../../../.configs/vitest/helpers/fastify.helper.ts)
- [`vitest.config.ts`](../../../vitest.config.ts) (Vite-merge / setup-files / mode→env side only)

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 1     |
| Nit      | 3     |
| Info     | 2     |

The infrastructure layer is in strong shape and closely matches its plan: the setup factory is a single frozen module-scope singleton returned by reference, the two registries (fake-timer, spy) hold their state next to the setup module rather than in a helper, both hijacks are gated on `DEBUG_TEST_POLLUTION` and guarded idempotent, the probe is a stateless dispatcher that registers all hooks inside the invoked function, the fake-timer wrap list covers the complete Pattern-B advance surface (and only that surface), and the five stderr line shapes match the documented contract exactly. Verified against the installed Vitest 4.1.10 runner: `task.concurrent` is set from `sequence.concurrent` (chunk-artifact.js:1771–1772), so the per-test `RISK` line is live for config-level concurrent tests, and `expect.getState().testPath` remains the per-file key. `pnpm typecheck` (`tsc -b`) is clean. No blocker and no correctness defect surfaced. Every finding sits in the **shared fixture bundle** (`shared-test-data.constant.ts`): a set of single-consumer / behaviour-specific values and one dead entry that violate the "no per-spec value in the bundle" and "keep the literal type" rules the plan owns.

## Findings

### Warning

#### W1 — Single-consumer, behaviour-specific expectations live in the worker-global shared bundle

- **File:** [`.configs/vitest/constants/shared-test-data.constant.ts`](../../../.configs/vitest/constants/shared-test-data.constant.ts) — `COMMON_STRING_CAMELCASE` (line 88), `COMMON_STRING_UPPERCASE` (line 90), `COMMON_NUMBER_DISTINCT_PAIRS_ARRAY` (line 83), `COMMON_STRING_NUMBER_PAIRS_ARRAY` (line 89)
- **Criterion:** plan §Shared fixture bundle ("It holds **no per-spec value** … A spec-specific value added to the bundle is a finding"; "Derived fixtures are composed from the bundle's own primitives — including by running a real schema or transform so they cannot drift"); testing README §Shared fixtures dividing line ("a case table, a behaviour-specific expectation, or a fixture meaningful to one unit only stays in that spec's `TEST_DATA`").

Each of these is consumed by exactly one spec and encodes a behaviour-specific expectation, not a broadly-reused primitive:

- `COMMON_STRING_CAMELCASE: "helloWorld"` and `COMMON_STRING_UPPERCASE: "HELLO WORLD"` are used **only** by `app/shared/helpers/string.helper.spec.ts`, as the `expected` outputs of `toCamelCase(COMMON_STRING)` / `toUpperCase(COMMON_STRING)` (spec lines 80, 146, 190, 195). They are hardcoded literals, so nothing ties them to the real transform — the exact drift the plan's "run a real transform" clause exists to prevent.
- `COMMON_NUMBER_DISTINCT_PAIRS_ARRAY` and `COMMON_STRING_NUMBER_PAIRS_ARRAY` are used **only** by `app/shared/helpers/map.helper.spec.ts` — pair/entry shapes meaningful to that one unit.

Because the bundle runs once per worker and is destructured by every spec, parking one-unit expectations there both pollutes the shared surface and lets a hardcoded expected value silently diverge from what the unit actually produces.

**Fix:** move each value into the consuming spec's frozen `TEST_DATA`. If any is judged genuinely shared and kept in the bundle, derive it from the bundle's own primitive via the real transform so it cannot drift, e.g.:

```ts
// derive, don't hardcode — cannot drift from StringHelper.toCamelCase
COMMON_STRING_CAMELCASE: toCamelCase(COMMON_STRING),
COMMON_STRING_UPPERCASE: toUpperCase(COMMON_STRING),
```

### Nit

#### N1 — `COMMON_NUMBER_PAIRS_ARRAY` is dead fixture data

- **File:** [`.configs/vitest/constants/shared-test-data.constant.ts`](../../../.configs/vitest/constants/shared-test-data.constant.ts) line 84
- **Criterion:** plan §Shared fixture bundle ("It holds no per-spec value"); `code-review-and-quality` (dead code).

`COMMON_NUMBER_PAIRS_ARRAY: [[NUMBER_1, NUMBER_1]]` is referenced by no spec anywhere in the repo (only its own definition and the generated `.tsc-cache` `.d.ts`). Because the bundle is a single exported object, `knip` (the `obsolete` script) cannot see individual dead keys, so this rots silently and grows the once-per-worker surface for nothing.

**Fix:** remove the entry.

#### N2 — `VALID_PORT_2` widens to `number`, breaking the "keep the literal type" contract

- **File:** [`.configs/vitest/constants/shared-test-data.constant.ts`](../../../.configs/vitest/constants/shared-test-data.constant.ts) line 40 (`VALID_PORT_2 = VALID_PORT_1 + COMMON_NUMBER`)
- **Criterion:** plan §Shared fixture bundle ("Shared primitives keep their literal type (`as const` on each) … a widened primitive silently degrades those assertions into tautologies"); `typescript-magician`.

TypeScript does not fold literal arithmetic, so `3000 + 42` types as `number`, and the object-level `as const` cannot re-narrow a value that is already `number`. Every other shared port (`VALID_PORT_1: 3000`, `MIN_PORT`, `MAX_PORT`) keeps its literal type; `VALID_PORT_2` does not. Impact is latent today — its one consumer (`app-env.schema.spec.ts`) only interpolates it into a runtime string — but a future type-level assertion against `SHARED_TEST_DATA.VALID_PORT_2` would silently degrade to `expectTypeOf<number>()`, a tautology.

**Fix:** pin the literal so it flows to specs, e.g. `const VALID_PORT_2 = (VALID_PORT_1 + COMMON_NUMBER) as 3042;` (or annotate `: 3042`).

#### N3 — Borderline single-consumer primitives in the bundle

- **File:** [`.configs/vitest/constants/shared-test-data.constant.ts`](../../../.configs/vitest/constants/shared-test-data.constant.ts) — `COMMON_DATE` (line 79), `COMMON_ONE_STRING_ARRAY` (line 85)
- **Criterion:** plan §Shared fixture bundle; testing README §Shared fixtures dividing line.

`COMMON_DATE: "2025-01-01"` is used only by `date.helper.spec.ts` and `COMMON_ONE_STRING_ARRAY: [STRING_A]` only by `set.helper.spec.ts`. Unlike W1 these are behaviour-neutral (a representative date; a one-element array), so they sit right on the dividing line — defensible as "common primitives that currently have one consumer," but equally candidates to move down to the consuming spec. Flagging for author judgment, not as a firm defect. Lower-confidence than W1; not blocking.

**Fix:** decide per value — keep if genuinely a reusable primitive; move into the spec's `TEST_DATA` if it is really a one-unit fixture.

### Info

#### I1 — Redundant `unknown`→`unknown` cast in the `toUnknown` getter

- **File:** [`.configs/vitest/constants/shared-test-data.constant.ts`](../../../.configs/vitest/constants/shared-test-data.constant.ts) lines 122–124

`get toUnknown() { return (value: unknown): unknown => castAsType<unknown>(value); }` — the parameter is already `unknown`, so the inner `castAsType<unknown>` is a no-op; the laundering effect comes entirely from the `(value: unknown): unknown` signature. Not a change request; the sanctioned unknown-cast belongs in the bundle. Could drop the inner cast to `return (value: unknown): unknown => value;` if touched.

#### I2 — Per-test snapshots compute surfaces the per-test diff never reads

- **File:** [`.configs/vitest/helpers/state-probe.helper.ts`](../../../.configs/vitest/helpers/state-probe.helper.ts) lines 44–69, 197–211

`snapshotState()` always computes `activeResources` (`process.getActiveResourcesInfo()`) and `mockImpls` (iterating `SHARED_MOCK`), but `diffPerTestSurfaces` deliberately excludes both, so the two per-test snapshots per test do that work for nothing. Cost is negligible (two shared mocks; only under `DEBUG_TEST_POLLUTION=1`) and a shared `snapshotState()` keeps the code simple, so this is an observation, not a fix request. A cheaper per-test snapshot variant would drop it if the probe is ever hot-path-sensitive.

## Strengths observed

- **Setup factory matches its three-role contract.** [`setup.ts`](../../../.configs/vitest/setup.ts) holds one frozen module-scope value (`vitestSetupValue`) and returns the same reference from the zero-arg `VitestSetup()`. The return type is `UnionToIntersection<(typeof VitestHelpers)[keyof typeof VitestHelpers]> & { sharedMock; sharedTestData }`, so it widens automatically as helpers are added — and because the value is annotated with that type, `tsc` forces the spread to stay in sync, so a new helper cannot type-lie at runtime. Registered as both a `setupFiles` entry and the destructure source (belt-and-suspenders).
- **State lives where the plan mandates.** The mutable registries (`clockAdvanceFilePaths`/`hijacked` in `fake-timer-registry.ts`, `spiesByFile`/`hijacked` in `spy-registry.ts`) sit next to the setup module, not under `helpers/`. Both helper modules (`state-probe`, `fastify`) are genuinely stateless dispatchers — the probe scopes `fileBaseline`/`filePath` inside `trackLeaksInSpec`, and all `beforeAll`/`beforeEach`/`afterAll` registrations happen inside that function, never at module scope.
- **Fake-timer hijack is exactly Pattern-B-complete.** All ten advance/run entry points are wrapped with explicit per-method assignments (no dynamic indexing on `vi`), each binds the original before reassignment (no recursion), and `setSystemTime` / `useFakeTimers` (Pattern A) are correctly left untracked. Idempotent via the `hijacked` guard; API stays narrow (record/query/clear + install).
- **Probe surfaces and line shapes are faithful to the contract.** Per-test diffs `globalThis` keys + `process` listeners + fake-timer state (using `isFakeTimers() || getMockedSystemTime() !== null`); file boundary adds increase-only, settled active resources (settle skipped when fake timers linger), shared-mock impl references, and installed spies. Immutable `Map`/`Set` snapshots; writes to `process.stderr`. The five `WARN`/`LEAK`/`RISK` shapes emit verbatim as documented.
- **`DEBUG_TEST_POLLUTION` gating is more robust than the plan's literal.** [`vitest.config.ts`](../../../vitest.config.ts) persists the flag on `process.env` during the root pass and reads it back per project (surviving `extends: true` re-evaluation), with a config-time guard that throws when `--mode=debug` is present but the flag fails to resolve — a broken round-trip fails loudly instead of running a vacuous green probe. Scripts toggle via `--mode=debug`, never an inline `DEBUG_TEST_POLLUTION=` prefix. `clearMocks: false` is present with no compensating setup-level reset.

## Out of scope (leads for other reviewers)

- **Testing plan ([`testing.plan.md`](../plans/testing.plan.md)):** `FastifyHelper.createTestApp` ([`helpers/fastify.helper.ts`](../../../.configs/vitest/helpers/fastify.helper.ts) lines 53–61) calls `mock.mockReset()` on caller-supplied `mocksToReset` inside `onTestFinished`. That is fine for per-test `vi.fn()`s, but if a spec ever passes a `SHARED_MOCK` member, it would reset a worker-global mock per-test and could race concurrent siblings. Worth checking on the spec-authoring side that no spec feeds a shared mock into `mocksToReset`.
- **Testing plan:** the fixture relocations in W1/N3 land in the consuming specs' `TEST_DATA` — verify the spec side keeps the literal type flowing (`as const`) and asserts against the constant rather than a re-typed inline literal, per testing README §Shared fixtures.
- **Tooling / build:** the repo's generated `.tsc-cache/` tree ships `.d.ts` copies of the fixture bundle; not a test-infra concern, but a reviewer of the build/typecheck setup may want to confirm it is git-ignored and not a stale-artifact source.
