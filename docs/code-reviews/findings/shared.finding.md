# Shared Utilities — Review Findings

Area plan: [`../plans/shared.plan.md`](../plans/shared.plan.md)
Skills invoked: `code-review-and-quality` (multi-axis baseline), `typescript-magician` (literal narrowing, `as const`, branded primitives).
Files reviewed: `app/shared/constants/**`, `app/shared/helpers/**`, `app/shared/types/**` (current state).

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 2     |
| Nit      | 3     |
| Info     | 1     |

The shared tree is in good shape: record-shaped constants consistently use `Object.freeze({...} as const)`, the `immutable.Map`/`Set` carve-out is applied exactly where the plan intends, names are concept-led and `SCREAMING_SNAKE`, and every value is a named export with no side effects. Two type-discipline issues stand out. The most consequential is a **literal-narrowing regression in `LOG_LEVEL`**: its type annotation pulls in pino's `(string & {})`, silently widening the log-level vocabulary to `string` and propagating a branded `string` (instead of a literal union) all the way to the env schema — the sibling `DB_CLIENT_TLS_SECURITY` already shows the correct `as const satisfies` pattern it should copy. Second, the timing unit types collapse to bare `number`, giving autocomplete but zero unit safety (a seconds value passes where milliseconds is expected). Neither is a runtime bug; both are type-vs-intent gaps. Remaining items are nits and one informational note. No blockers.

## Findings

### Warnings

#### W1 — `LOG_LEVEL` type annotation widens the level vocabulary to `string`

- **Severity:** warning
- **File:** `app/shared/constants/log-level.constant.ts:4`
- **Flagged by:** `typescript-magician`, `code-review-and-quality` (plan: _TypeScript discipline_ — "`as const` narrows values to literals so consumers get autocomplete")

The constant is annotated `Set<NonNullable<LoggerOptions["level"]>>`. In pino, `LoggerOptions["level"]` is `LevelWithSilentOrString = Level | "silent" | (string & {})` (`node_modules/pino/pino.d.ts:229,378`). The `(string & {})` member makes the set's element type equivalent to `string`, so the closed 7-value vocabulary is lost at the type level. Two concrete consequences:

1. `app/shared/schemas/app-env.schema.ts:91` calls `zEnum(LOG_LEVEL.toArray(), …)`. Because `toArray()` yields `string[]`, the enum output — and therefore the branded `LogLevel` type re-exported from `app/shared/types/app-env.type.ts:16` — resolves to `string & brand` instead of `("debug" | "error" | "fatal" | "info" | "silent" | "trace" | "warn") & brand`. Every `LogLevel` consumer loses autocomplete and exhaustiveness.
2. Any `LOG_LEVEL.has(x)` guard accepts an arbitrary `string`, so it can never narrow.

The sibling `db-client.constant.ts` already demonstrates the fix — validate against the external spec while preserving literals with `as const satisfies`:

```ts
const LOG_LEVEL = Set([
  "debug",
  "error",
  "fatal",
  "info",
  "silent",
  "trace",
  "warn",
] as const satisfies readonly NonNullable<LoggerOptions["level"]>[]);
```

Runtime behaviour is unaffected (only the 7 values pass validation either way); this is purely restoring the literal narrowing the rest of the area relies on.

#### W2 — Timing unit types collapse to `number`, giving no unit safety

- **Severity:** warning (Consider — the loosening may be intended)
- **File:** `app/shared/types/timing.type.ts:6-10`
- **Flagged by:** `typescript-magician` (plan: _Types_ — "branded primitives")

`TimingInMilliseconds` and `TimingInSeconds` are each `(<named literals>) | (number & {})`. The `(number & {})` escape hatch means both types reduce to `number`, so they are structurally identical and interchangeable. Nothing stops a seconds value flowing into a milliseconds parameter or vice-versa: `getFutureDate` (`date.helper.ts:21`) expects `TimingInSeconds` and `delay` (`timing.helper.ts:3`) expects `TimingInMilliseconds`, yet `getFutureDate(TIMING_IN_MS.SECONDS_ONE)` and `delay(TIMING_IN_S.MINUTES_ONE)` both compile — a silent 1000x error. The types buy autocomplete but no protection.

If the autocomplete-with-escape-hatch behaviour is deliberate, this is acceptable as-is. If unit safety is wanted, brand the two types (and the constant values) so the compiler rejects cross-unit passing, e.g. `type TimingInMilliseconds = number & { readonly __unit: "ms" }` with a small `ms()/s()` constructor — a larger change than W1, so flagging it as a trade-off to decide rather than a required fix.

### Nits

#### N1 — `HTTP_STATUS.CSRF_TOKEN_MISMATCH: 419` is not a standard status code

- **Severity:** nit
- **File:** `app/shared/constants/http.constant.ts:14`
- **Flagged by:** `code-review-and-quality` (plan: _When a constant is not truly constant_ — the "defined by an external spec or platform" check)

`419` is not an IANA-registered HTTP status code; it is a framework convention (Laravel's "Page Expired"/CSRF). Every other entry in `HTTP_STATUS` is a real RFC code, so a reader reasonably assumes `419` is too. Either drop it if unused, or add a one-line note that it is a deliberate non-standard code, so the mix isn't mistaken for an error.

#### N2 — Authored utility types live in a `.d.ts` file

- **Severity:** nit
- **File:** `app/shared/types/app/utility-types.d.ts`
- **Flagged by:** `code-review-and-quality` (readability / convention)

This file `export type`s hand-authored, explicitly-imported types (`AnyMap`, `MapKey`, `ObjectEntries`, …). The `.d.ts` extension is conventionally reserved for ambient declarations and global augmentation — which the two neighbours use correctly (`vite-env.d.ts` and `vitest.d.ts` carry `/// <reference>` directives and `declare global`). Renaming to `utility-types.ts` matches the convention and keeps `.d.ts` meaningful as a signal. Functionally equivalent today; a consistency point.

#### N3 — `HTML_ESCAPE_REPLACE_REGEX` is the one non-immutable "constant"

- **Severity:** nit
- **File:** `app/shared/constants/html.constant.ts:11`
- **Flagged by:** `code-review-and-quality` (plan: _Immutability_ — "no mutation paths exist")

A `/g`-flagged `RegExp` carries mutable `lastIndex` state that persists across `.test()`/`.exec()` calls. The sole current consumer uses `.replace()` (`html.helper.ts:9`), which resets `lastIndex`, so today it is safe. But as a shared, exported regex, the next consumer that reaches for `.test()`/`.exec()` in a loop inherits a stateful, order-dependent footgun — the only exported value in the area that isn't immutable. Consider constructing it at the call site, or documenting that it must only be used with `.replace()`.

### Info

#### I1 — `date.helper.ts` mutates the shared dayjs singleton at module load

- **Severity:** info
- **File:** `app/shared/helpers/date.helper.ts:7`
- **Flagged by:** `code-review-and-quality` (plan: _Helper hygiene_ — "no shared mutable state")

`dayjs.extend(utcPlugin)` runs at import time and mutates the process-wide dayjs instance. It is necessary (downstream `.utc()` depends on it) and is correctly commented, but it makes the module non-tree-shakeable and introduces an import-order dependency for anything relying on `.utc()`. Worth knowing, not a change request; deeper helper-purity analysis belongs to the helpers area (see Out of scope).

## Strengths observed

- **Immutability done right on record-shaped groups.** `http.constant.ts`, `timing.constant.ts`, and `zod.constant.ts` all use `Object.freeze({...} as const)` with `as const` on the literal (not the freeze wrapper), so values narrow to literals and the runtime freeze is real. `HTTP_METHODS` composes already-frozen `SAFE`/`UNSAFE` inner objects.
- **The `immutable` carve-out is applied precisely.** `HTML_ESCAPE_CHARS` (keyed lookup) and `DB_CLIENT_TLS_SECURITY` / `LOG_LEVEL` (value sets) map naturally to `Map`/`Set`, exactly the case the plan carves out.
- **`db-client.constant.ts` is the model pattern.** `Set([...] as const satisfies readonly NonNullable<ConnectOptions["tlsSecurity"]>[])` checks against the external spec while preserving the literal union — this is what W1 asks `LOG_LEVEL` to copy.
- **`zod.constant.ts` ties the frozen object to its source union** via the mapped-type annotation `{ [Code in ZodIssue["code"] as Uppercase<Code>]: Code }`, so a drift between the object and the union is a compile error.
- **Naming and exports follow the plan.** Concept-led group names, `SCREAMING_SNAKE_CASE` keys, all named exports (no defaults), no side effects in the constants files.
- **Timing naming and consumption match the convention.** Keys use `<SOURCE_UNIT>_<AMOUNT>` with `ONE_TENTH`/`ONE_HALF` disambiguated, and consumers destructure at module scope re-attaching the unit (`const { MINUTES_FIVE: FIVE_MIN_S } = TIMING_IN_S;` in `date.helper.spec.ts:16`) exactly as prescribed.
- **Helper hygiene at the breadth level.** Every helper exports a frozen `<Concept>Helper` namespace whose PascalCase matches the kebab filename, uses `import type` for type-only imports, and declares explicit return types. `app-env.type.ts` is a clean template-literal + mapped type stripping `VITE_APP_` and camelCasing.

## Out of scope (cross-area leads)

- **Validation area** ([`../plans/validation.plan.md`](../plans/validation.plan.md)):
  - `zod.constant.ts` `ISSUE_CODES` — the mapped-type annotation guarantees the object matches `ZodIssue["code"]` at compile time, but the runtime string list is hand-maintained; issue-code derivation discipline is the validation plan's call.
  - `app-env.type.ts` and `vite-env.d.ts` derive their types from `@shared/schemas/app-env.schema` and `@shared/wrappers/zod.wrapper`; the schema/wrapper surface (branded outputs, the library-config seam) belongs to validation.
  - W1's downstream symptom lands in `app-env.schema.ts` (`logLevelSchema`) — the fix is on the constant, but a validation reviewer should confirm the branded `LogLevel` type is what the schema expects.
- **Helpers area (depth)** ([`../plans/helpers.plan.md`](../plans/helpers.plan.md)):
  - `type.helper.ts` `castAsType<T>(value: unknown): T` is a centralized unchecked cast used across `map`/`object`/`string` helpers to assert the return types of `Object.entries`/`keys`/`values` and lodash calls — soundness review is helpers-depth.
  - In-place mutation helpers (`object.helper.ts` `stripKeysInPlace`; `set.helper.ts` `addValuesInPlace`/`stripValuesInPlace`) mutate caller-owned collections; the purity/contract trade-off (honestly signalled by the `InPlace` suffix) is a helpers-depth question.
- **Logger area:** the W1 widening also degrades any `LOG_LEVEL.has(...)`-style guard in the logger module to accept arbitrary strings; confirm alongside the constant fix.
