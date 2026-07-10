# Build Configs — Review Findings

_Review date: 2026-07-09 · Plan: [`../plans/build-configs.plan.md`](../plans/build-configs.plan.md)_
_Skills invoked: `code-review-and-quality`, `vite`, `typescript-magician`._

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 0     |
| Nit      | 0     |
| Info     | 2     |

The build-config surface is in excellent shape and matches ADR-0001 and ADR-0003 to the letter. The shared base holds only the universal `resolve.tsconfigPaths` opt-in; `resolve.conditions` is kept out of the base and layered per-runtime (`["node"]` in both the server runtime config and the server test project), so the array-concatenation leak the plan warns about cannot occur. Every config passes a literal object to `mergeConfig` under `satisfies UserConfig` (never a function, never `as`, never a falsy conditional), and the ESLint `no-restricted-imports`/`consistent-type-assertions: never` rules make the `as UserConfig` regression unwritable. Alias coherence holds across all three surfaces — `@configs`/`@server`/`@shared` are declared once in the root `tsconfig.json` `paths` block, inherited by every referenced project, consumed by Vite via the opt-in, and mirrored exactly (and reachably) in the import-sort groups. `pnpm typecheck` (`tsc -b`) is green (exit 0). No blockers, warnings, or nits. Two info-level observations follow, both about the durability of the tsconfig-paths opt-in across future Vite upgrades and one doc-outline drift.

## Findings

### Info

#### I1 — The alias resolver rests on an `@experimental` Vite flag, and `tsc` cannot prove it works

- **Severity:** info
- **File:** [`.configs/vite/shared.config.ts`](../../../.configs/vite/shared.config.ts) line 6 (`resolve.tsconfigPaths: true`)
- **Flagged by:** `vite` (built-in tsconfig-paths opt-in) + build-configs plan §"Built-in tsconfig-paths resolution"
- **Why it matters:** In the installed Vite (8.1.4) `resolve.tsconfigPaths` is declared on `ResolveOptions` with `@default false` and `@experimental` (`node_modules/.../vite/dist/node/index.d.ts` line ~1997-2003). The opt-in is genuinely built into Vite 8 and is the ADR-0001-sanctioned mechanism, so there is nothing to change today. The durability note is what's worth knowing: this whole area's defining risk (per the plan) is a change that "silently ships the wrong thing" with no failing test — and a no-op'd `tsconfigPaths` is exactly that failure. Critically, **a green `tsc -b` does not prove Vite is resolving aliases**: the type-checker reads the `paths` block directly, while Vite reads it through this experimental flag; the two resolvers are independent. If a future Vite minor renames, removes, or changes the semantics of `tsconfigPaths` (an experimental API is explicitly allowed to), alias resolution would silently fall back to unresolved specifiers at dev/runtime while `pnpm typecheck` stays green.
- **Suggested action (not a change request):** When bumping the Vite major/minor (a plan trigger already), add a runtime smoke check to the upgrade — e.g. confirm `pnpm dev` boots and a module imported via `@server/*`/`@shared/*` actually resolves — rather than relying on the typecheck gate to catch a regressed opt-in. Optionally record the "typecheck ≠ Vite-resolution" caveat next to the flag in the pattern doc so the next upgrader knows the gate has a blind spot here.

#### I2 — Pattern-doc server outline is looser than the enforced `satisfies` discipline

- **Severity:** info
- **File:** [`docs/vite/multi-target-config.md`](../../../docs/vite/multi-target-config.md) lines ~56-70 (server-config outline) — _not a file in this plan's edit scope; routed below_
- **Flagged by:** `typescript-magician` + build-configs plan §"`mergeConfig` arity and source-type guard" (line 48: the second `mergeConfig` argument carries `satisfies UserConfig`)
- **Why it matters:** The doc's outline writes the server override as `mergeConfig(sharedConfig, defineConfig({ resolve: { conditions: ["node"] } }))` — `defineConfig` wrapping the inner override and **no** `satisfies UserConfig`. The actual [`.configs/vite/server.config.ts`](../../../.configs/vite/server.config.ts) instead writes `defineConfig(mergeConfig(sharedConfig, { … } satisfies UserConfig))`, i.e. it applies `satisfies UserConfig` to the override literal exactly as the plan mandates. The code is the stricter, correct form; the doc outline is the drift. No defect in the config files — just a canonical-doc that undersells the discipline the code (and plan) enforce, which could mislead a contributor adding a second runtime into dropping the `satisfies`.
- **Suggested fix (route to the doc-editing / ADR reviewer):** Align the doc outline so the override literal carries `satisfies UserConfig`, matching `server.config.ts`. Editing `docs/**` is out of this plan's scope (belongs to the `doc-editing` rule); surfaced here so the shape gets reconciled in the right lane.

## Strengths observed

- **`resolve.conditions` isolation is exactly per ADR-0001.** The shared base ([`shared.config.ts`](../../../.configs/vite/shared.config.ts)) carries no `conditions`; `["node"]` appears only in the server runtime config ([`server.config.ts`](../../../.configs/vite/server.config.ts) line 9) and in the server test project ([`vitest.config.ts`](../../../vitest.config.ts) lines 62-64). The `mergeConfig` array-concatenation leak (a `node`/`browser` condition bleeding across runtimes) is structurally impossible because the base holds nothing to concatenate.
- **`satisfies UserConfig` everywhere, `as` nowhere.** Both Vite configs and the vitest merge object pass literal objects under `satisfies` (`UserConfig` / `ViteUserConfig` / `TestProjectInlineConfiguration`), preserving the narrow literal `mergeConfig` needs while catching nested-key typos. The ESLint `@typescript-eslint/consistent-type-assertions: ["error", { assertionStyle: "never" }]` rule makes the `as UserConfig` regression the plan warns about a lint error — the safety net is enforced, not just conventional.
- **`mergeConfig` is always called with a plain object second argument** (never a config-returning function, never a falsy conditional), so the silent `{}`/passthrough footguns cannot arise. Where build context is needed, [`vitest.config.ts`](../../../vitest.config.ts) uses the correct `defineConfig(({ mode }) => mergeConfig(base, override))` shape — the function wraps the outer call, not the `mergeConfig` argument.
- **The test runner merges the whole base via `vite`'s `mergeConfig`, not `vitest/config`'s re-export.** [`vitest.config.ts`](../../../vitest.config.ts) line 1 imports `mergeConfig` from `vite` and merges the full `sharedConfig` (no cherry-picking of `tsconfigPaths`), exactly as the plan requires; `defineConfig` is correctly sourced from `vitest/config` for the `test` field typing.
- **Alias coherence is airtight across all three surfaces.** `@configs`/`@server`/`@shared` are declared once in [`tsconfig.json`](../../../tsconfig.json) `paths` (lines 16-18), inherited by `tsconfig.server/shared/test.json` via `extends` (no second source of truth), consumed by Vite through the opt-in (no competing `resolve.alias` block anywhere), and mirrored in the ESLint import-sort groups ([`eslint.config.ts`](../../../eslint.config.ts) lines 149-156). The mirror is genuinely live: `simple-import-sort` uses longest-match-wins (verified in the installed `imports.js` lines 107-118), so the 7-8 char `^@configs`/`^@server`/`^@shared` matches beat the 2-char generic `^@?\w`, and the dedicated groups are reached rather than shadowed.
- **The base stays minimal.** It owns only the single key both runtimes truly agree on (the tsconfig-paths opt-in), honoring the ADR's "keep the base small" rule and the rename-test property (each runtime config reads on its own).

## Out of scope

- **`vitest.config.ts` runner-specific surface** — the `--mode=debug` / `DEBUG_TEST_POLLUTION` round-trip (lines 10-24), coverage, `isolate`/`pool`/`sequence`, `setupFiles`, and the two test projects' non-resolve fields are the testing / test-infra plans' concern; only the Vite-merge surface was reviewed here (and it is clean). One note for that reviewer: the config mutates `process.env.DEBUG_TEST_POLLUTION` as a side effect during config evaluation — worth a glance under the testing plan for projects-mode re-evaluation semantics.
- **Compiler-option choices (configuration / TS-compiler-stance plans)** — `tsconfig.server.json` sets `types: ["node", "vite/client"]` while `tsconfig.shared.json` sets `types: []`. The agnostic-shared / node-server split looks correct, but the completeness of the `types` arrays and the `moduleResolution: "bundler"` stance belong to the configuration plan, not here.
- **Broader ESLint flat-config orchestration (configuration plan)** — only the alias-coherence slice of the import-sort groups was reviewed. The placement of the side-effect group (`^ `) after the alias groups rather than first (a deviation from `simple-import-sort`'s default group order), and the rest of the flat-config stack, are the configuration plan's remit.
- **Vite `resolve.conditions: ["node"]` completeness (ADR-settled)** — setting `conditions` replaces rather than augments Vite's default SSR conditions; this is the ADR-0001 / pattern-doc-sanctioned value and works (dev boots, typecheck green), so it was not re-litigated. Flagged only so a future reviewer knows the semantics were considered.
