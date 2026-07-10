# Findings — Implementation Order

Derived from the 11 `*.finding.md` files in [`./findings/`](./findings/) (review batch of 2026-07-09, branch `chore/prettier-claude-and-tooling`, tip `a446266`).

This is a **point-in-time action plan**, not a codebase-agnostic doc: it cites concrete finding IDs, file paths, and line ranges so each item is directly actionable — the same exception the findings files themselves take to the rename-test / doc-editing rule.

> **Updated after adversarial re-verification (2026-07-09).** Every finding was independently re-checked against the current code and installed tool versions. Result: 1 finding was retracted, 1 was trimmed, and 1 kept its severity but had its rationale corrected. All others held.
>
> - **`configuration:B1` — RETRACTED (invalid).** It claimed the `clean:full` / `clean:regen` scripts were broken because a `clean` script "does not exist". But `pnpm clean` is a **pnpm 11 built-in** command (alias `purge`, supports `--lockfile`), and `pnpm <name>` runs the builtin when no script shadows it — so both scripts work as written. The original test used `pnpm run clean` (forces script-mode), which was the wrong command form. **There is no blocker; Phase 0 is removed.**
> - **`configuration:W1` — still a warning, but its cause was wrong.** The manifest/lockfile divergence is real; the "`fastify-zod-openapi` peer-requires exactly `6.0.0`" rationale is false (that peer is an optional `^5.0.1`). Corrected below.
> - **`validation:N1` — trimmed.** The operation `description` trailing-period is real; the `summary` half of the original claim was false. Scope narrowed below.

## How to read this

- **Duplicates are grouped.** Where two or more areas flagged the same root cause, they are consolidated into one work item and marked **⧉ grouped**. A grouped item's severity is that of its worst member.
- **Order = worst-first, then dependency/impact.** Warnings → nits → info. Within a tier, items that unblock or de-risk others, or that carry downstream reach, come first.
- Finding IDs are written `<area>:<ID>` — e.g. `server:W1`.

## Consolidation summary

| Raw findings                | Blocker | Warning | Nit | Info |
| --------------------------- | ------- | ------- | --- | ---- |
| 57 reviewed, 56 valid (1 retracted) | 0 | 10 | 28 | 18 |

Grouped into **~25 work items** across 3 phases (7 groups fold 20 raw findings together).

---

## Phase 1 — Warnings

### 1. [warning] Make the pnpm manifest tell the truth about `@fastify/swagger-ui`

- **Consolidates:** `configuration:W1`
- **Files:** [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) lines 26–27; [`package.json`](../../package.json) line 44
- **Action:** an undocumented `overrides` block silently downgrades the declared `6.1.0` to the installed `6.0.0`, breaking ADR-0004's "manifest and lockfile tell the same story." Pin the direct devDependency to the version actually installed and drop the override, or keep the override with a one-line rationale comment.
- **⚠ Corrected rationale:** the override's motive is **not** the `fastify-zod-openapi` peer — that peer is an **optional `^5.0.1`**, which neither `6.0.0` nor `6.1.0` satisfies. Don't assume `6.0.0` is peer-mandated.
- **✔ Investigated & resolved (2026-07-09).** Root cause was a **stale override**: #31 pinned `6.0.0` (the only 6.x at the time) with both a devDep and an override; the later `a1ac834` bump moved the manifest to `6.1.0` but left the override at `6.0.0`. `6.1.0` is safe (its sole change is `fastify-plugin ^5 → ^6`; `fastify-plugin@6` is fastify-5-compatible and already in the tree; there is no `fastify@6`). The working tree now aligns the override to `6.1.0`, so manifest/lockfile/install agree. The `overrides` block is now **redundant** (`@fastify/swagger-ui` is a direct devDep only) and could be deleted for full cleanliness; kept per the maintainer's call.

### 2. [warning] ⧉ Restore literal-type narrowing (`as const satisfies` / pin literals)

- **Consolidates:** `shared:W1` (warning) · `server:N1` (nit) · `test-infra:N2` (nit)
- **Files:**
  - [`app/shared/constants/log-level.constant.ts`](../../app/shared/constants/log-level.constant.ts) line 4 — `Set<NonNullable<LoggerOptions["level"]>>` pulls in pino's `(string & {})`, widening the 7-value vocabulary to `string`; propagates a branded `string` through `app-env.schema.ts` to `LogLevel` and defeats every `LOG_LEVEL.has(...)` guard. Copy the sibling `db-client.constant.ts` pattern: `Set([...] as const satisfies readonly NonNullable<LoggerOptions["level"]>[])`. (Widening confirmed with a live `tsc` probe against installed pino 10.3.1.)
  - [`app/server/constants/signals.constant.ts`](../../app/server/constants/signals.constant.ts) line 3 — the `Readonly<Record<Signals, Signals>>` annotation discards the `as const` literals; move the constraint to `... as const satisfies Record<Signals, Signals>` to keep both narrowing and the completeness check.
  - [`.configs/vitest/constants/shared-test-data.constant.ts`](../../.configs/vitest/constants/shared-test-data.constant.ts) line 40 — `VALID_PORT_2 = VALID_PORT_1 + COMMON_NUMBER` widens to `number` (confirmed against the generated `.d.ts`); pin the literal (`as 3042`).
- **Why grouped:** one class of defect — an annotation or arithmetic that defeats `as const` literal narrowing. `shared:W1` leads because it reaches downstream into validation and the logger guard; a validation reviewer should re-confirm the branded `LogLevel` after the constant fix.

### 3. [warning] Decide timing unit-type safety

- **Consolidates:** `shared:W2` (Consider)
- **Files:** [`app/shared/types/timing.type.ts`](../../app/shared/types/timing.type.ts) lines 6–10
- **Action:** `TimingInMilliseconds` and `TimingInSeconds` both collapse to `number` via `(number & {})`, so a seconds value flows into a milliseconds parameter and compiles — a silent 1000× error (verified: `DateHelper.getFutureDate(TIMING_IN_MS.SECONDS_ONE)` type-checks). Either accept the autocomplete-only trade-off explicitly, or brand the two types (`number & { readonly __unit: "ms" }`) with `ms()/s()` constructors. A decision, not a mechanical fix — larger than item 2, kept separate.

### 4. [warning] ⧉ Drop `DOM` libs from the Node-only tsconfigs

- **Consolidates:** `server:W1` (warning) · `configuration:N1` (nit)
- **Files:** [`tsconfig.server.json`](../../tsconfig.server.json) line 9, [`tsconfig.shared.json`](../../tsconfig.shared.json) line 9, [`tsconfig.test.json`](../../tsconfig.test.json) line 9; [`eslint.config.ts`](../../eslint.config.ts) line 29 (`...globals.browser`)
- **Action:** `DOM`/`DOM.Iterable` expose `window`, `document`, DOM `fetch` etc. to Node-only code that would `ReferenceError` at runtime — a typechecks-but-crashes footgun. Narrow the server (and, per `configuration:N1`, the shared) leaf `lib` to `["ESNext"]` and drop `...globals.browser`.
- **✔ Fix confirmed safe:** verification proved `lib: ["ESNext"]` typechecks clean — `skipLibCheck: true` suppresses the DOM references inside `vite/client.d.ts`, so the `types: ["node","vite/client"]` on `tsconfig.server.json` does **not** force DOM. Still re-run `pnpm typecheck` after the change.
- **Reconcile before acting:** `server:W1` treats `tsconfig.shared.json`'s DOM as defensible (shared code may run in a browser later); `configuration:N1` recommends dropping it from all three. `testing:I1` confirms the **test** config's DOM widening is intentional and correct — leave `tsconfig.test.json` as-is unless the shared decision says otherwise.

### 5. [warning] Export `startup`'s public function type

- **Consolidates:** `modules:W1`
- **Files:** [`app/server/modules/startup/index.ts`](../../app/server/modules/startup/index.ts); consumed at [`app/server/helpers/app/app-start.helper.ts`](../../app/server/helpers/app/app-start.helper.ts) lines 45–47
- **Action:** unlike its four sibling modules (`db`/`logger`/`openapi`/`shutdown` all export their function-signature type), `startup` exports no `claimPort` type, so the composition layer hand-restates `(instance: AppInstance) => Promise<void>` inline. Add a `ClaimPortFunction` type under `startup/types/`, re-export it from the barrel, and consume it in `app-start.helper.ts`. (Sibling asymmetry confirmed by reading all five barrels.)

### 6. [warning] ⧉ Give the shutdown route a response schema (and a named handler)

- **Consolidates:** `validation:W1` (warning) · `server` out-of-scope lead (inline handler)
- **Files:** [`app/server/modules/shutdown/routes/shutdown/shutdown.route.ts`](../../app/server/modules/shutdown/routes/shutdown/shutdown.route.ts) lines 22–41
- **Action:** the route returns `{ accepted, timestamp }` on both 202 and 401 with no `schema.response` (in fact `instance.post` is called with no options object at all) — no serialiser validation, no OpenAPI fragment, contract lives only in the handler literal. Declare a `shutdownResponseSchema` through the zod wrapper (adding `zBoolean` to the re-exports) and attach it to both status codes, **or** record the exemption in an ADR note / route comment. While in this file, address the server reviewer's lead: replace the inline arrow with a named handler.

### 7. [warning] Rename `isNumber` → `isFiniteNumber`

- **Consolidates:** `helpers:W1`
- **Files:** [`app/shared/helpers/number.helper.ts`](../../app/shared/helpers/number.helper.ts) lines 5–7
- **Action:** `isNumber` is `Number.isFinite` under a general name, so `isNumber(1/0)` and `isNumber(NaN)` return `false` (reproduced) — a silent surprise for a caller gating a computed value. Rename to `isFiniteNumber` (matching the `isInteger` precedent), or add a one-line JSDoc stating the finite-only contract; update the spec's case names to match.

### 8. [warning] ⧉ Fix the logging README's error-normalization guidance

- **Consolidates:** `documentation:W1` (warning) · `logging` + `documentation` out-of-scope leads (confirm call sites)
- **Files:** [`docs/logging/README.md`](../logging/README.md) lines 60–66
- **Action:** the README teaches ``new Error(`${rawError}`)`` — the exact template-literal stringification ADR-0010 rejects (interpolating a `symbol` throws). Change the example to throw-free `new Error(String(rawError))` and reframe it to point at the project's single normalization seam rather than an inline per-call-site step. Then confirm no call site inlines the rejected pattern instead of routing through the `normalizeError`/`toError` helper. Invoke `doc-coauthoring` + `documentation-and-adrs` for the README edit.

### 9. [warning] Reconcile the two env-filename docs

- **Consolidates:** `documentation:W2`
- **Files:** [`README.md`](../../README.md) lines 8, 21; [`docs/db/db-initialize.md`](../db/db-initialize.md) lines 10–16
- **Action:** the README frames local config as `.env.dev.local`; `db-initialize.md` frames it as `.env`. Docker Compose auto-loads only `.env`, so a newcomer following the README alone gets a DB bring-up with unset variables (Compose emits a "variable is not set" warning — not entirely silent, but still broken). Add one reconciling cross-reference sentence to each doc (no behaviour change). The configuration reviewer should verify the actual Vite `--mode dev` precedence and Docker `.env`-only load match whatever wording is settled. Invoke the doc-editing skills.

### 10. [warning] ⧉ Shared test-fixture hygiene

- **Consolidates:** `test-infra:W1` (warning) · `test-infra:N1` (nit) · `test-infra:N3` (nit) · `testing:N2` (nit)
- **Files:** [`.configs/vitest/constants/shared-test-data.constant.ts`](../../.configs/vitest/constants/shared-test-data.constant.ts); [`app/shared/helpers/map.helper.spec.ts`](../../app/shared/helpers/map.helper.spec.ts) line 51
- **Action:** (all four consumer counts confirmed by repo-wide grep)
  - `W1` — move single-consumer, behaviour-specific expectations (`COMMON_STRING_CAMELCASE`, `COMMON_STRING_UPPERCASE`, `COMMON_NUMBER_DISTINCT_PAIRS_ARRAY`, `COMMON_STRING_NUMBER_PAIRS_ARRAY`) out of the worker-global bundle into the consuming spec's `TEST_DATA`; if any stays shared, derive it via the real transform so it can't drift from the hardcoded literal.
  - `N1` — delete the dead `COMMON_NUMBER_PAIRS_ARRAY` (zero consumers; knip can't see bundle keys).
  - `N3` — decide per value on the borderline single-consumer primitives (`COMMON_DATE`, `COMMON_ONE_STRING_ARRAY`).
  - `testing:N2` — as `map.helper.spec.ts` fixtures move, use the already-imported `UNDEFINED_VALUE` instead of a raw `undefined` literal at line 51.
  - **On relocation**, keep the literal type flowing (`as const`) and assert against the constant, not a re-typed inline literal.

---

## Phase 2 — Nits

### 11. [nit] ⧉ Tidy the build-failure logging path

- **Consolidates:** `logging:N1` (nit) · `logging:N2` (nit) · `server:I1` (info) · `server:I2` (info)
- **Files:** [`app/server/helpers/app/app-build.helper.ts`](../../app/server/helpers/app/app-build.helper.ts) lines 64–95, [`app/server/helpers/app/app-start.helper.ts`](../../app/server/helpers/app/app-start.helper.ts) lines 82–114
- **Action:** on a build failure the same error is logged twice (build-layer `error` + start-layer `fatal`), and the async build-layer line can be lost before the synchronous fallback `process.exit` (build's own `await instance.close()` does not flush Pino — confirmed). Prefer letting the exit-owning layer own the terminal log — drop the `instance.log.error` in `build`'s catch and rely on `start`'s `fatal`. Also drop the redundant `normalizeError(toError(rawError))` double-conversion (`N2`).

### 12. [nit] ⧉ Document the dayjs module-load side effect

- **Consolidates:** `helpers:N1` (nit) · `shared:I1` (info)
- **Files:** [`app/shared/helpers/date.helper.ts`](../../app/shared/helpers/date.helper.ts) line 7
- **Action:** `dayjs.extend(utcPlugin)` mutates the global dayjs singleton at import time — a sanctioned but real deviation from the module-scope-purity rule. No code change; record the accepted exception in the shared-helpers plan.

### 13. [nit] `LOOPBACK_HOSTS` getter rebuilds the Set on every read

- **Consolidates:** `server:N2`
- **Files:** [`app/server/constants/hosts.constant.ts`](../../app/server/constants/hosts.constant.ts) lines 5–11
- **Action:** compute the frozen `immutable.Set` once as a plain value above the object rather than as a getter, so reads are free and no future per-request consumer silently re-allocates.

### 14. [nit] Rename the `ZOD` constant group to the concept

- **Consolidates:** `server:N3`
- **Files:** [`app/server/constants/zod.constant.ts`](../../app/server/constants/zod.constant.ts)
- **Action:** the group holds a single env-validation sentinel string, unrelated to Zod's API; rename group + file to the concept (e.g. `ENV_VALIDATION` / `env-validation.constant.ts`).

### 15. [nit] Flag or drop the non-standard HTTP 419

- **Consolidates:** `shared:N1`
- **Files:** [`app/shared/constants/http.constant.ts`](../../app/shared/constants/http.constant.ts) line 14
- **Action:** `419` is a framework convention (Laravel CSRF), not an IANA code, and is used nowhere in the codebase (grep-confirmed). Drop it, or add a one-line note that it is a deliberate non-standard code.

### 16. [nit] Rename `utility-types.d.ts` → `.ts`

- **Consolidates:** `shared:N2`
- **Files:** [`app/shared/types/app/utility-types.d.ts`](../../app/shared/types/app/utility-types.d.ts)
- **Action:** the file `export type`s hand-authored, explicitly-imported types; `.d.ts` is conventionally reserved for ambient/global augmentation. Rename to `utility-types.ts`.

### 17. [nit] Guard the shared `HTML_ESCAPE_REPLACE_REGEX`

- **Consolidates:** `shared:N3`
- **Files:** [`app/shared/constants/html.constant.ts`](../../app/shared/constants/html.constant.ts) line 11
- **Action:** the `/g`-flagged shared `RegExp` carries mutable `lastIndex`; safe today only because the sole consumer uses `.replace()`. Construct it at the call site, or document that it must only be used with `.replace()`.

### 18. [nit] ⧉ DateHelper & object-helper spec coverage

- **Consolidates:** `helpers:N3` (nit) · `helpers:N4` (nit) · `helpers:N5` (nit) · `helpers:N2` (nit)
- **Files:** [`app/shared/helpers/object.helper.spec.ts`](../../app/shared/helpers/object.helper.spec.ts), [`app/shared/helpers/date.helper.ts`](../../app/shared/helpers/date.helper.ts) + [`.spec.ts`](../../app/shared/helpers/date.helper.spec.ts), [`app/shared/helpers/object.helper.ts`](../../app/shared/helpers/object.helper.ts) / [`set.helper.ts`](../../app/shared/helpers/set.helper.ts)
- **Action:**
  - `N3` — add the empty-object case to `getObjectEntries`/`Keys`/`Values` specs (reuse `EMPTY_OBJECT`).
  - `N4` — decide and pin DateHelper's invalid-input contract (confirmed: `toISOTimestamp("nonsense")` throws `RangeError`, `format`-based helpers return `"Invalid Date"`).
  - `N5` — pick one return convention for the `InPlace` helpers (all `void`, or JSDoc the `stripKeysInPlace` same-reference `Omit` retype).
  - `N2` — pin `TZ=UTC` for the test run so `toLocalTimestamp` can assert an exact value instead of a shape regex (a testing-config change — coordinate with test-infra).

### 19. [nit] ⧉ Spec consistency nits

- **Consolidates:** `testing:N1` (nit) · `testing:N3` (nit) · `testing:N4` (nit)
- **Files:** [`app/shared/helpers/date.helper.spec.ts`](../../app/shared/helpers/date.helper.spec.ts), [`app/server/modules/db/db.module.spec.ts`](../../app/server/modules/db/db.module.spec.ts), [`app/shared/helpers/timing.helper.spec.ts`](../../app/shared/helpers/timing.helper.spec.ts) line 38
- **Action:**
  - `N1` — replace `toStrictEqual` with `toBe` on the seven primitive assertions in `date.helper.spec.ts`.
  - `N3` — move `mockClose` from module scope into the test body (per-test fresh mock, no `afterAll` reset). Note: the reset is at `db.module.spec.ts:36`, not line 37 as the finding cites.
  - `N4` — fold `stubSetTimeout` into `TEST_DATA` as a rest-spread function getter to restore the `TEST_DATA → describe` open-order.

### 20. [nit] Route operation `description` punctuation

- **Consolidates:** `validation:N1` (trimmed on verification)
- **Files:** [`app/server/routes/api/health/db/db.route.ts`](../../app/server/routes/api/health/db/db.route.ts) lines 29–30, [`app/server/routes/api/health/server/server.route.ts`](../../app/server/routes/api/health/server/server.route.ts) lines 25–26
- **Action:** the operation-level `description` ends with a period while per-field `.meta` descriptions (correctly) don't. Pick one convention for the operation-level `description` across the health routes. **Note:** the operation `summary` fields correctly have **no** trailing period — the original finding's `summary` claim was false and has been dropped.

### 21. [nit] Empty-path rendering in the Zod issue formatter

- **Consolidates:** `validation:N2`
- **Files:** [`app/server/helpers/zod-server.helper.ts`](../../app/server/helpers/zod-server.helper.ts) lines 51, 55–58
- **Action:** a root-level issue (empty `path`) renders the broken line `- : <message>` (confirmed: `zToDotPath([])` returns `""` on installed zod 4.4.3). Unreachable via `validateEnv` today but latent in the exported general-purpose helper — substitute a sentinel (`zToDotPath(issue.path) || "(root)"`) or document the field-keyed-only contract.

### 22. [nit] ADR-0022 reciprocal links

- **Consolidates:** `documentation:N1`
- **Files:** [`docs/adr/0022-route-schema-validation-and-openapi.md`](../adr/0022-route-schema-validation-and-openapi.md); back-links belong in [`docs/adr/0007-library-wrapper-seam.md`](../adr/0007-library-wrapper-seam.md) and [`docs/adr/0009-environment-validation-gate.md`](../adr/0009-environment-validation-gate.md)
- **Action:** 0022 back-links to 0007/0009 but neither forward-links to 0022 (grep-confirmed), unlike the established `0008→0020` precedent. Add forward `Related` links (a sanctioned in-place `Related` edit; reasoning bodies stay untouched). Invoke the doc-editing skills.

### 23. [nit] ⧉ pnpm parallel-execution doc accuracy

- **Consolidates:** `documentation:N2` (nit) · `documentation:N3` (nit)
- **Files:** [`docs/pnpm/parallel-script-execution.md`](../pnpm/parallel-script-execution.md) line 39; [`docs/pnpm/pnpm-parallel-research.md`](../pnpm/pnpm-parallel-research.md) line 320
- **Action:** `N2` — soften "undocumented / best-effort": single-package `--parallel` is upstream-intentional (PR #6785, 2023), undocumented on pnpm.io but supported; keep the ordering caveat. `N3` — the research dossier's cross-reference row still quotes pre-fix wording marked "Refuted" though the header says the item was applied; annotate the row as since-corrected. Invoke the doc-editing skills.

---

## Phase 3 — Info (mostly no-action / forward-looking)

Carry an action:

### 24. [info] Add a Vite-upgrade smoke check for the tsconfig-paths opt-in

- **Consolidates:** `build-configs:I1`
- **Files:** [`.configs/vite/shared.config.ts`](../../.configs/vite/shared.config.ts) line 6
- **Action:** `resolve.tsconfigPaths` is `@experimental` / `@default false` in Vite 8.1.4 (confirmed in the installed `.d.ts`); `tsc` reads `paths` directly and cannot prove Vite resolves aliases. On the next Vite major/minor bump, add a runtime smoke check (`pnpm dev` boots, an `@server/*`/`@shared/*` import resolves) rather than trusting the green typecheck gate.

### 25. [info] Align the multi-target pattern-doc server outline

- **Consolidates:** `build-configs:I2`
- **Files:** [`docs/vite/multi-target-config.md`](../vite/multi-target-config.md) lines ~56–70
- **Action:** the doc outline omits `satisfies UserConfig` on the server override literal, looser than the enforced `server.config.ts`. Align the outline. Route through the doc-editing skills.

No action required (recorded so they aren't re-discovered as defects):

- `configuration:I1` — `engines.node: ">=26.0.0"` is a deliberate leading-edge policy pin, coherent with the toolchain (runtime `v26.5.0`, `@types/node ^26`).
- `logging:I1` — the `pino-pretty` worker-thread transport is dev-only; revisit the flush strategy only if it ever moves to production.
- `logging:I2` — no per-request access log by design (`disableRequestLogging: true` paired with the configured logger).
- `validation:I1` — `config({ jitless: true })` global side effect is correctly isolated behind the wrapper seam (grep-confirmed sole importer); keep the seam intact.
- `validation:I2` — health routes schematise only the 200 response; add error-response shapes only if a documented error contract is later wanted.
- `test-infra:I1` — redundant `unknown`→`unknown` cast in the `toUnknown` getter; drop the inner cast only if the file is touched.
- `test-infra:I2` — probe computes per-test surfaces the diff never reads; negligible, `DEBUG_TEST_POLLUTION`-only.
- `testing:I1` — `tsconfig.test.json` redundantly re-declares `types: ["node"]`; harmless (inherited via `extends`).
- `modules:I1` — same-module deep references are textually identical to an illegal cross-module reach (grep-confirmed all are same-module self-refs today); a lint rule forbidding `@server/modules/X/<subfolder>` outside module X would give the boundary mechanical teeth (tooling lead).
- `modules:I2` — the aggregator-vs-helper "inline or extract" line is a per-module judgement call; extract only if `db`'s internals grow.
- `modules:N1` — `shutdown/routes/index.ts` is a single-route pass-through (hypothetical seam); keep as a growth seam or register the route directly. **(nit)**
- `modules:N2` — `kill.type.ts` carries a PID-lookup type under a kill-named file; naming-cohesion only. **(nit)**
- `documentation:I1` — empty, untracked `docs/decisions/` directory (stray tooling artifact; ADRs live in `docs/adr/`).
- `documentation:I2` — the pnpm research dossier is a legitimate point-in-time citation artifact; tightening items 4–7 remain unapplied (enhancements, not defects).

> `modules:N1` and `modules:N2` are nits listed here beside their sibling info items so the whole `modules` area reads in one place; fold them into any `modules`-touching work rather than as standalone changes.

---

## Cross-cutting themes (for whoever picks these up)

1. **Literal-type preservation** (item 2, and the design call in item 3) — the `(string & {})` / `(number & {})` widening idiom recurs; `as const satisfies` is the fix pattern, and a single named alias could de-duplicate the idiom across `map`/`set`/`object` helpers and `utility-types` (a shared-types lead).
2. **DOM in Node tsconfigs** (item 4) — flagged independently by both `server` and `configuration`; verified the fix typechecks.
3. **Shutdown route** (item 6) — validation contract + handler style land in the same file; the auth-correctness of that route (loopback guard, `timingSafeEqual`, single-shot arming) remains a `security-and-hardening` lead not covered by this batch.
4. **Test fixtures ↔ specs** (items 10, 18, 19) — fixture relocation and spec-coverage nits interlock; do item 10 first so the spec edits land against the moved fixtures.

## Verification note

This plan reflects an adversarial re-verification pass (2026-07-09) that re-checked all 57 findings against current code and installed tool versions. The one class of error found — a "does not exist" claim tested with the wrong command form (`configuration:B1`, `pnpm run clean` vs the `pnpm clean` builtin) — is a reminder to reproduce a claim's exact invocation before grading it a blocker.
