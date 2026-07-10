# Helpers — Review Findings

Area plan: [`../plans/helpers.plan.md`](../plans/helpers.plan.md)
Skills applied: `code-review-and-quality` (multi-axis baseline), `typescript-magician` (return-type narrowing, generic discipline, `as const`), `vitest` (spec conventions against [`docs/testing/README.md`](../../testing/README.md)).
Files in scope: `app/shared/helpers/*.helper.ts` (10) and their `*.helper.spec.ts` siblings (10).

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 1     |
| Nit      | 5     |
| Info     | 1     |

The helpers area is in strong shape. Every file honours the frozen-`<Concept>Helper`-namespace contract, carries explicit return types, and ships a matching table-driven spec with genuinely thoughtful edge cases (surrogate-pair HTML escaping, `$`-token replacement, symbol/number-keyed maps, stored-`undefined` map values) and rich `expectTypeOf` type-level assertions. No correctness bugs were found and no helper carries a module-specific dependency. The one warning is a naming/semantics mismatch on `isNumber` (a finite-only check wearing a general name); the nits are spec-coverage gaps and small purity/consistency tensions with the plan. Nothing blocks merge.

## Findings

### Warnings

#### W1 — `isNumber` is a finite-number check wearing a general-number name

- **File:** [`app/shared/helpers/number.helper.ts`](../../../app/shared/helpers/number.helper.ts) lines 5-7
- **Flagged by:** `code-review-and-quality` + plan → "Codebase-agnostic naming" ("names describe what the helper does to its input")
- **Why it matters:** `isNumber` is implemented as `Number.isFinite(value)` and typed `value is number`, so it returns `false` for `Infinity`, `-Infinity`, and `NaN` — all of which are `typeof === "number"`. A caller who reaches for a guard named `isNumber` to gate a computed value can be silently surprised: `isNumber(1 / 0)` and `isNumber(Number.MAX_VALUE * 2)` are both `false`. The sibling `isInteger` names itself exactly after its predicate (`Number.isInteger`); `isNumber` breaks that symmetry by naming a `Number.isFinite` check generically. The guard itself is sound (it only ever narrows conservatively) — the risk is purely the misleading name.
- **Suggested fix:** Rename to `isFiniteNumber` to match the predicate and the `isInteger` precedent, or, if the general name is deliberate, add a one-line JSDoc stating the finite-only contract (`/** True only for finite numbers — excludes NaN and ±Infinity. */`) so the exclusion is visible at the call site. Update the spec's `describe`/case names to match whichever is chosen.

### Nits

#### N1 — `dayjs.extend(utcPlugin)` is a module-load side effect on shared global state

- **File:** [`app/shared/helpers/date.helper.ts`](../../../app/shared/helpers/date.helper.ts) line 7
- **Flagged by:** plan → "Purity" ("No shared mutable state at module scope"; "no side effects")
- **Why it matters:** Importing `date.helper` (or anything transitively importing it) mutates the process-global `dayjs` singleton as an import side effect. The plan defines this area as side-effect-free at module scope, and this is a direct, if benign, deviation: the extend is additive and idempotent, and the `.utc()` calls in `toDisplayHour`/`toDisplayTimestamp` genuinely depend on it (the existing inline comment documents that dependency correctly per the code-comments rule). There is no per-call alternative in dayjs, so the realistic resolution is to record the accepted deviation, not to remove it.
- **Suggested fix:** Accept and document — a short note in the shared-helpers plan (or a one-line ADR reference) that `date.helper` is the sanctioned exception to the module-scope-side-effect rule because dayjs plugins install globally. The inline comment already covers the WHY at the call site; the gap is only that the plan reads as absolute.

#### N2 — `toLocalTimestamp` spec asserts shape only, not a value

- **File:** [`app/shared/helpers/date.helper.spec.ts`](../../../app/shared/helpers/date.helper.spec.ts) lines 148-154 (regex at lines 54-55)
- **Flagged by:** `vitest` + plan → "Spec coverage expectations" (assert exact values where possible)
- **Why it matters:** `toLocalTimestamp` formats in the runner's local timezone, so the test can only `toMatch` a shape regex (`MM/DD/YYYY, hh:mm:ss A`). A format regression that stays inside that shape — wrong field order, a swapped separator that still matches `\d{2}\/\d{2}\/\d{4}` — would pass. Every other date helper is pinned to an exact string against the fixed `beforeAll` clock; this one is not, purely because the output is timezone-dependent.
- **Suggested fix:** Pin the timezone (set `TZ=UTC` for the test run, or `process.env.TZ` in the Vitest setup — a testing-config change) and assert the exact expected string against the fixed system time, the same way `toDisplayTimestamp` does. If pinning the TZ is out of appetite, leave a comment on the case explaining that the shape match is deliberate because the value is TZ-dependent.

#### N3 — `getObjectEntries` / `getObjectKeys` / `getObjectValues` specs omit the empty-object case

- **File:** [`app/shared/helpers/object.helper.spec.ts`](../../../app/shared/helpers/object.helper.spec.ts) lines 104-140
- **Flagged by:** `vitest` + plan → "Spec coverage expectations" ("Edge cases the spec must cover: empty inputs …")
- **Why it matters:** The three entry/key/value helpers are only exercised against the two-key `makeObject()` fixture. The plan lists empty inputs as a must-cover edge case, and `EMPTY_OBJECT` is already available from the shared fixture bundle (it is destructured and used elsewhere in the same file). `getObjectEntries({})` → `[]` is a trivial but currently-unasserted contract.
- **Suggested fix:** Add one case per helper asserting the empty-object input returns `[]` (value equality plus the corresponding `expectTypeOf`), reusing the destructured `EMPTY_OBJECT`.

#### N4 — DateHelper's invalid-input behaviour is untested and appears inconsistent

- **File:** [`app/shared/helpers/date.helper.ts`](../../../app/shared/helpers/date.helper.ts) lines 25-39 (`toDisplayHour`, `toDisplayTimestamp`, `toISOTimestamp`, `toLocalTimestamp`)
- **Flagged by:** `code-review-and-quality` + plan → "Spec coverage expectations" (typed-error / edge cases)
- **Why it matters:** These helpers accept dayjs `ConfigType`, which admits arbitrary strings. The `format`-based helpers and the `toISOString`-based helper are expected to diverge on invalid input — dayjs `format(...)` yields the string `"Invalid Date"` for an unparseable input, whereas `toISOString()` bottoms out in `Date.prototype.toISOString()`, which throws `RangeError: Invalid time value`. So `toISOTimestamp("nonsense")` likely throws while `toDisplayHour("nonsense")` likely returns `"Invalid Date"`. Neither path is pinned by a test, so the contract for bad input is undefined and could drift silently on a dayjs bump.
- **Suggested fix:** Decide the intended contract (validate-and-throw a typed error, or document "caller must pass a valid `ConfigType`") and add a case pinning it for at least one `format`-based and the `toISOString`-based helper. If the throw is intended to stay, cover it with `expect(() => toISOTimestamp(bad)).toThrow(...)`; if not, guard the input.

#### N5 — Inconsistent return shape across the `InPlace` helpers

- **Files:** [`app/shared/helpers/object.helper.ts`](../../../app/shared/helpers/object.helper.ts) lines 52-64 (`stripKeysInPlace`) vs [`app/shared/helpers/set.helper.ts`](../../../app/shared/helpers/set.helper.ts) lines 7-14 and 21-28 (`addValuesInPlace`, `stripValuesInPlace`)
- **Flagged by:** `typescript-magician` + plan → "Purity" (in-place-mutation contract)
- **Why it matters:** All three carry the `InPlace` suffix, but `stripKeysInPlace` returns the mutated object retyped as `Omit<TObject, TKeys>` while the two set helpers return `void`. Two friction points: (1) the contract is not uniform, so a reader cannot predict from the suffix whether a value comes back; (2) `stripKeysInPlace` returning the *same* reference under a narrowed `Omit` type means the original binding keeps its pre-strip type while the returned binding claims the key is gone — a mutate-and-retype footgun where `obj` still looks like it has the stripped key though runtime deleted it. The spec even documents this (`should mutate and return the same object reference`).
- **Suggested fix:** Pick one convention for `InPlace` helpers. Either have all three return `void` (the suffix already signals mutation, and callers keep their own reference), or, if the `Omit` retype on `stripKeysInPlace` is deliberately useful, add a one-line JSDoc noting it returns the *same* mutated reference retyped (not a copy) so the stale-original-binding hazard is explicit.

### Info

#### I1 — DateHelper's clock-reading functions are non-deterministic ambient reads

- **File:** [`app/shared/helpers/date.helper.ts`](../../../app/shared/helpers/date.helper.ts) lines 9-23 (`getCurrentDate`, `getCurrentISOTimestamp`, `getCurrentTimestamp`, `getFutureDate`)
- **Flagged by:** plan → Scope ("every function is a deterministic transform from its inputs to its return value") and "Purity" ("no environment reads")
- **Why it matters (observation, not a change request):** These four functions take no meaningful transform input and read the ambient wall clock, so they are not deterministic input→output transforms the way the rest of the area is — the system clock is an environment read. This is inherent to a date helper and the specs already compensate by pinning the clock with `vi.setSystemTime` in `beforeAll`. Flagging only so the area owner is aware the DateHelper sits at the edge of the plan's "pure/deterministic" defining property; there is no clean fix short of injecting a clock, which would be over-engineering here.

## Strengths observed

- **Namespace contract is followed uniformly** across all 10 helpers: a single `Object.freeze({...} as const)` export named as the PascalCase of the kebab file name, no default exports, no loose function exports.
- **Explicit return types on every function**, with generics that narrow inputs and outputs together (`replace` → `Replace<...>`, `toCamelCase` → `CamelCase<...>`, the `getMapValue` conditional-return over `TFallback`).
- **Type-level testing is a real strength** — `expectTypeOf` guards narrowing (`isArray`, `isString`, `hasObjectKey`, `hasSetValue`), the `getMapValue` known-key-vs-arbitrary-key return split, and the `stripKeysInPlace` `Omit` result are all asserted, not just the runtime values.
- **Edge cases are thoughtful:** HTML escaping around non-BMP surrogate pairs, `replace` treating a `$&` replacement literally, `toUpperCase` covering the German sharp-s expansion and Greek sigma, and `getMapValue` covering stored-`undefined`, immutable, number-keyed, and symbol-keyed maps.
- **`InPlace` naming discipline** correctly carries the mutation into the call site for the three mutating helpers.
- **No `any` anywhere;** every `unknown`→concrete transition is funnelled through the single sanctioned `castAsType` escape hatch.
- **Test patterns respect the worker model:** `timing.helper.spec` filters the shared `setTimeout` spy by unique marker `ms` values (correct under `clearMocks: false` + concurrent siblings) and restores the spy in the installing suite's `afterAll`; `date.helper.spec` uses the permitted fixed-clock Pattern A (`vi.setSystemTime` in `beforeAll` / `vi.useRealTimers` in `afterAll`) rather than advancing a shared fake clock.

## Out of scope

Cross-area leads surfaced for the relevant reviewers — not investigated or changed here.

- **Testing / shared-fixtures area:** [`.configs/vitest/constants/shared-test-data.constant.ts`](../../../.configs/vitest/constants/shared-test-data.constant.ts) builds its fixtures using the very helpers several specs then test — `deepFreeze` calls `ArrayHelper.isArray` and `ObjectHelper.isPlainObject`, and `VALID_DEV_APP_ENV` is derived via `StringHelper.replace` / `toCamelCase`. This self-referential coupling (unit-under-test participates in constructing its own test fixtures) is worth a look under the testing/shared plan.
- **Shared-types area:** the literal-preserving widening idiom `(string & {})` / `(number & {})` / `(PropertyKey & {})` is duplicated inline across `map.helper.ts`, `set.helper.ts`, `object.helper.ts`, and `utility-types.d.ts`. A single named alias in the types area could de-duplicate it — a call for the shared-types reviewer, not the helpers area.
- **Constants / types areas (shared plan):** `html.constant.ts`, `timing.constant.ts`, and `utility-types.d.ts` were read only as consumed by the helpers; their own review belongs to [`../plans/shared.plan.md`](../plans/shared.plan.md).
