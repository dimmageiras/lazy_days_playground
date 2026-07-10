# Testing — Review Findings

Area plan: [`../plans/testing.plan.md`](../plans/testing.plan.md)
Skills invoked: `code-review-and-quality`, `vitest`, `typescript-magician`
Canonical convention doc: [`../../testing/README.md`](../../testing/README.md)
Scope: the spec surface — every `**/*.spec.{ts,tsx}` (32 files), `tsconfig.test.json`, and the `test*` scripts in `package.json`. The infrastructure beneath the specs (setup factory, fake-timer registry, spy registry, probe internals, shared-mock/fixture bundles) is reviewed only as the contract specs are judged against; infra-side findings are deferred to `test-infra.plan.md` under Out of scope.

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 0     |
| Nit      | 4     |
| Info     | 1     |

The spec suite is exemplary and near-uniformly conformant with the project testing README. All 32 specs open in the canonical order (imports → `VitestSetup()` destructure → `trackLeaksInSpec(label)` → unit-under-test destructure → frozen `TEST_DATA` → `describe`), pull `it`/hooks from the suite collector and `expect`/`onTestFinished` from the test context (zero raw runner imports at module scope), freeze `TEST_DATA` with `as const`, rest-spread function getters out of the literal, reuse the shared fixture bundle, and — critically — filter shared `mock.calls` by per-test identity so the `clearMocks: false` + concurrency posture never accumulates. No `.sequential`, no Pattern-B fake-clock advance, no direct `DEBUG_TEST_POLLUTION` access, no snapshot or truthy/falsy matchers. Every finding below is a low-severity consistency or fragility nit; nothing blocks merge and no correctness or CI-stability defect was found.

## Findings

### Nits

#### N1 — `toStrictEqual` used for primitive comparisons instead of `toBe`

- **Severity:** nit
- **File:** [`app/shared/helpers/date.helper.spec.ts`](../../../app/shared/helpers/date.helper.spec.ts) — lines 90, 98, 108, 117, 127, 136, 144
- **Criterion:** testing README "Assertion style" — *prefer specific matchers*; `vitest` skill (`toBe` is the precise matcher for primitives)
- **Why it matters:** every assertion in this spec compares a primitive — an ISO string (`result.toISOString()`, `getCurrentISOTimestamp()`, `toDisplayHour(...)`, `toDisplayTimestamp(...)`, `toISOTimestamp(...)`) or a number (`getCurrentTimestamp()`) — yet uses `toStrictEqual`. `toStrictEqual` does structural/recursive equality; for a primitive the precise matcher is `toBe` (`Object.is`). Every other spec in the suite (`html.helper`, `number.helper`, `string.helper`, `error.helper`, …) uses `toBe` for primitive equality, so this spec is the lone outlier. Behaviour is identical, so this is purely a readability/consistency point.
- **Fix:** replace `toStrictEqual` with `toBe` on these seven primitive assertions. Leave the `toMatch(EXPECTED_LOCAL_TIMESTAMP_SHAPE)` regex assertion (line 152) as-is.

#### N2 — raw `undefined` literal where the shared bundle's `UNDEFINED_VALUE` is already imported

- **Severity:** nit
- **File:** [`app/shared/helpers/map.helper.spec.ts`](../../../app/shared/helpers/map.helper.spec.ts) — line 51 (inside `GET_CASES`)
- **Criterion:** testing README "Shared fixtures" — *a hand-rolled primitive the bundle already provides is a smell*; assert against the shared constant
- **Why it matters:** the case `{ expected: undefined, key: STRING_B, … }` hand-rolls a bare `undefined` for the "absent key" expectation, even though this same file already destructures `UNDEFINED_VALUE` from `sharedTestData` (line 21) and uses it at line 70 (`makeMapWithUndefined`). The self-inconsistency is the smell — the sentinel is in scope and used elsewhere in the file, so the case table should reference it.
- **Fix:** use `expected: UNDEFINED_VALUE` in the `GET_CASES` "absent key" entry so the sentinel is referenced consistently across the file.

#### N3 — module-scoped `mockClose` instead of a per-test fresh mock

- **Severity:** nit (latent flake footgun)
- **File:** [`app/server/modules/db/db.module.spec.ts`](../../../app/server/modules/db/db.module.spec.ts) — line 24 (declaration), line 37 (reset), line 92 (`toHaveBeenCalledTimes(1)`)
- **Criterion:** testing README "Mocking" (`clearMocks: false` → filter by per-test identity); plan "Mock strategy from the spec's seat"
- **Why it matters:** `const mockClose = vi.fn();` is hoisted to module scope, which forces the `afterAll` `mockClose.mockReset()` and leaves the `toHaveBeenCalledTimes(1)` assertion counting a worker-lifetime mock rather than a per-test one. It is correct *today* only because `describe("setupDb")` holds a single test. The sibling helper specs that assert on a `close` mock — [`close-with-grace.helper.spec.ts`](../../../app/server/modules/shutdown/helpers/close-with-grace.helper.spec.ts) and [`hot-reload.helper.spec.ts`](../../../app/server/modules/shutdown/helpers/hot-reload.helper.spec.ts) — create `close = vi.fn()` fresh inside each test, so a second concurrent test cannot accumulate. As written, adding a second test to this suite would reintroduce exactly the cross-sibling `mock.calls` accumulation the convention warns against.
- **Fix:** create `const mockClose = vi.fn();` inside the test body (alongside `client`), drop it from the `afterAll` reset; the fresh-per-test mock needs no teardown and matches the sibling specs.

#### N4 — `stubSetTimeout` declared between `TEST_DATA` and `describe`

- **Severity:** nit
- **File:** [`app/shared/helpers/timing.helper.spec.ts`](../../../app/shared/helpers/timing.helper.spec.ts) — line 38
- **Criterion:** testing README "Test data" open-order (`… → frozen TEST_DATA → describe`); function-getter rest-spread convention
- **Why it matters:** `const stubSetTimeout = castAsType<typeof setTimeout>(() => 0);` is a stub *function* placed after `TEST_DATA` and before `describe`, which breaks the canonical `TEST_DATA → describe` adjacency the layout rule protects. The suite's established idiom for a spec-local factory/stub is a camelCase function getter rest-spread out of the `TEST_DATA` literal (`const { makeInstance, ...TEST_DATA } = { … } as const;`), as used in `map.helper`, `object.helper`, `set.helper`, `app-build.helper`, `hot-reload.helper`, and others. Keeping it as a loose const both diverges from that idiom and interrupts the open-order.
- **Fix:** fold it into the `TEST_DATA` literal as a rest-spread function getter — e.g. add `get stubSetTimeout() { return castAsType<typeof setTimeout>(() => 0); }` and destructure `const { stubSetTimeout, ...TEST_DATA } = { … } as const;` — restoring the `TEST_DATA → describe` adjacency and matching the `makeX` pattern.

### Info

#### I1 — `tsconfig.test.json` re-declares `types: ["node"]` identically to the base

- **Severity:** info (not a change request)
- **File:** [`tsconfig.test.json`](../../../tsconfig.test.json) — line 10
- **Criterion:** plan "TypeScript test config" — *relaxes only what the test surface needs; anything stricter belongs back in the base*
- **Why it matters:** the test config correctly widens `lib` to `["ESNext", "DOM", "DOM.Iterable"]` (looser than the base's `["ESNext"]`, appropriate for the DOM-ish test surface) and adds no stricter-than-base option — fully conformant. The `types: ["node"]` line is identical to the base and, because `extends` inherits any compiler option the child does not override, is redundant; dropping it would inherit the same value. Purely informational — harmless, and worth leaving if it documents intent. No action required.

## Strengths observed

- **Uniform spec layout.** All 32 specs open in the exact canonical order and route every helper, fixture, mock, and the leak tracker through a single synchronous `VitestSetup()` destructure — no direct imports from `.configs/vitest/helpers`, `constants`, `mocks`, or the registries (verified by search).
- **Scoped runner surface, no leakage to module scope.** Zero specs import `it`, `expect`, or any lifecycle hook at module scope; `it` and hooks are pulled from the `describe` suite collector (`(it) => …` / `const { beforeAll } = it;`), `expect`/`onTestFinished`/`task` from the test context. Module-level runner imports are confined to `describe`, `vi`, and the type-level `expectTypeOf` (which has no context-scoped form).
- **Per-test mock identity discipline.** Every spec touching a shared or hoisted mock filters `mock.calls` / `mock.results` by a per-test-unique reference — `calledWith === env`/`=== instance` (`app-build`, `app-start`, `shutdown.module`), unique URL (`cooperative-shutdown`), unique pid (`kill`), unique host (`db.module`). This is exactly what the `clearMocks: false` + `sequence.concurrent` posture demands, and it is applied consistently.
- **Concurrency-safe clock handling.** `date.helper` uses Pattern A (`vi.setSystemTime` in `beforeAll` + `vi.useRealTimers()` in `afterAll`); `timing.helper` sidesteps the shared clock entirely by spying on `setTimeout` and driving the captured callback by hand — precisely the plan's recommended isolation. No spec advances the shared fake clock (Pattern B), uses `.sequential`, `.only`, `.skip`, or relies on test ordering.
- **Shared-mock teardown in the installing child suite.** `db.module` and `cooperative-shutdown` reset their shared-mock implementations in the `describe`-scoped `afterAll` (not a root-level hook), honouring ADR-0019's teardown-placement rule that keeps the pollution probe's file-exit snapshot clean.
- **Rich, correct type-level assertions.** `expectTypeOf` narrowing/branding assertions (`app-env.schema`, `map.helper`, `object.helper`, `set.helper`, `string.helper`) sit alongside runtime assertions, exercising the branded-record and utility-type contracts without degrading into tautologies — the literal types survive because the specs assert against the shared frozen constants.
- **Clean probe and script contract.** Every spec calls `trackLeaksInSpec` exactly once with a terse `<subject>.<kind>` label; no spec reads or writes `DEBUG_TEST_POLLUTION`. The `test:pollution:*` scripts gate the probe purely via `--mode=debug` with no inline `DEBUG_TEST_POLLUTION=` prefix.
- **Alias coherence.** All spec imports resolve through the three declared path aliases (`@configs/*`, `@server/*`, `@shared/*`), all present in the base `tsconfig.json` `paths` block.

## Out of scope

Leads for other reviewers — surfaced, not actioned here:

- **`test-infra.plan.md` (test infrastructure).** The specs' correctness rests on infra this plan does not own: the `VitestSetup()` factory and its `UnionToIntersection` return typing ([`.configs/vitest/setup.ts`](../../../.configs/vitest/setup.ts)), the shared fixture bundle and its `deepFreeze`/`castAsType` composition ([`.configs/vitest/constants/shared-test-data.constant.ts`](../../../.configs/vitest/constants/shared-test-data.constant.ts)), the `SHARED_MOCK` surface ([`.configs/vitest/mocks/shared.mock.ts`](../../../.configs/vitest/mocks/shared.mock.ts)), the `StateProbeHelper` leak tracker, and the fake-timer/spy registries. In particular: several specs (`app-build`, `app-start`, `shutdown.module`, `claim-port`, `kill`, `listen`) declare per-file `vi.mock` factories (`fastify`, `pid-port`, `close-with-grace`, sibling helper modules) that other specs import for real, and rely on Vitest scoping those module mocks per-file under `isolate: false` — the README flags this as a probe-coverage boundary ("restore or unmock it in-file, or promote into the shared-mock surface"). Whether that per-file scoping holds and whether the probe should cover it is an infra-plan question.
- **`build-configs.plan.md` (build/TS configs).** The cross-surface alias-coherence invariant — that `@configs`/`@server`/`@shared` mean the same thing in `tsconfig.test.json`, the Vite/vitest runtime config, and the source tsconfigs — is owned there. This review confirmed only that the aliases the specs use exist in the base `paths` block.
