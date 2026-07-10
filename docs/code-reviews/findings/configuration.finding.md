# Configuration — Review Findings

Area plan: [`../plans/configuration.plan.md`](../plans/configuration.plan.md)
Reviewed at: branch `chore/prettier-claude-and-tooling`, tip `a446266`.
Skills invoked: `code-review-and-quality` (baseline), `pnpm`, `node`.
Files in scope reviewed: `package.json`, `pnpm-workspace.yaml`, `tsconfig.json` + `tsconfig.{server,shared,test}.json`, `eslint.config.ts`, `vitest.config.ts` (config-artefact side only), `knip.config.ts`, `pnpm-lock.yaml`, `.configs/pnpm/patches/@types__eslint-plugin-security@3.0.1.patch`. No `.npmrc`, `.pnpmfile`, or Husky hooks present.

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 1     |
| Nit      | 1     |
| Info     | 1     |

The configuration surface is unusually disciplined: the pnpm supply-chain settings, the exact-pinning stance, and the solution-style composite TypeScript topology are faithful, well-commented implementations of ADR-0004 and ADR-0002, and the `typecheck` and `lint` gates both pass clean (verified). (An earlier draft flagged the `clean:full` / `clean:regen` scripts as a broken blocker; that finding was **retracted on verification** — `pnpm clean` is a pnpm 11 built-in command, alias `purge`, with a `--lockfile` flag, so both wrappers run the builtin and work as written.) One supply-chain warning: an undocumented `overrides` entry silently downgrades `@fastify/swagger-ui` from the version the manifest advertises, breaking the "manifest and lockfile tell the same story" invariant ADR-0004 is built on. The remaining items are a low-severity `lib`/globals drift from ADR-0002's own "as its source needs" qualifier, and one observation.

## Findings

> **Retracted finding (was B1).** An earlier draft graded `clean:full` / `clean:regen` a merge-blocking bug on the belief that a `clean` script "does not exist" (evidence: `pnpm run clean` → `[ERR_PNPM_NO_SCRIPT]`). That test was the wrong command form. `pnpm clean` is a **pnpm 11 built-in** command (`pnpm clean --help` → `Usage: pnpm clean [--lockfile]`, alias `purge`, removes `node_modules`), and `pnpm <name>` runs the builtin when no script shadows it. Both wrappers therefore run the builtin and work as written — verified on pnpm 11.10.0. No blocker exists.

### Warning

#### W1 — Undocumented `overrides` silently downgrades `@fastify/swagger-ui` below the declared version

- **Files:** [`pnpm-workspace.yaml`](../../../pnpm-workspace.yaml) lines 26–27; [`package.json`](../../../package.json) line 44
- **Flagged by:** `pnpm` (overrides / supply-chain); configuration plan → _Dependency hygiene_ and _pnpm settings_; governing decision: ADR-0004 ([`docs/adr/0004-pnpm-dependency-stance.md`](../../adr/0004-pnpm-dependency-stance.md))
- **Why it matters:** `package.json` declares `"@fastify/swagger-ui": "6.1.0"` in `devDependencies`, but the `overrides` block forces the entire tree — including that direct dependency — to `6.0.0`. The lockfile confirms the effective install is `6.0.0` (importer specifier and version both `6.0.0`), so the manifest advertises a version that is never installed. This directly breaks the invariant ADR-0004 makes central: _"Manifest and lockfile tell the same story: reading the manifest tells a reviewer exactly what is installed, and every version move is a deliberate, reviewable diff."_ It is also one of the few pnpm-workspace settings with no explanatory comment (the `patchedDependencies` block is likewise bare); every other entry (the `minimumReleaseAge` tripwire, `blockExoticSubdeps`, the empty `allowBuilds`) carries a rationale, so the silent override reads as accidental. Its motivation is neither documented nor self-evident: `fastify-zod-openapi@5.6.1` declares an **optional** peer `@fastify/swagger-ui: ^5.0.1`, which neither the installed `6.0.0` nor the declared `6.1.0` satisfies — so that peer does **not** explain the pin to `6.0.0`, and the real driver of the override is unclear. (Verified against the installed `fastify-zod-openapi` package metadata; the earlier "6.1.0 violates the peer / 6.0.0 satisfies it" rationale was wrong.)
- **Suggested fix:** Make the manifest tell the truth. Pin the direct devDependency to the version actually required and drop the whole-tree override:

  ```jsonc
  // package.json
  "@fastify/swagger-ui": "6.0.0",
  ```

  ```yaml
  # pnpm-workspace.yaml — remove the overrides block entirely
  ```

  If the override must be retained (e.g. to constrain a transitive path), keep it but pin the direct dep to `6.0.0` too and add a one-line comment stating **why** `6.0.0` is required — matching the commenting discipline of the rest of the file. Establish that reason first: it is not the `fastify-zod-openapi` peer (an optional `^5.0.1` that neither version satisfies), so the actual driver needs confirming before the pin is documented.

- **Update — investigated and resolved (2026-07-09).** Root cause: the override was a **stale leftover**, not a compatibility pin. It was added in #31 (`594316b`, 2026-07-07) when `6.0.0` was the only 6.x; the dep-bump `a1ac834` (2026-07-09) then moved the manifest devDep to `6.1.0` but left the override at `6.0.0`. `6.1.0`'s only change vs `6.0.0` is its own `fastify-plugin` dependency (`^5 → ^6`), and `fastify-plugin@6` supports fastify 5 (no peer, `devDependencies.fastify: ^5.0.0`) and is already resolved in the tree via `@fastify/static` / `@fastify/swagger` — and there is no `fastify@6` (latest is `5.10.0`) — so `6.1.0` is safe. The working tree now aligns the override to `6.1.0`, so manifest, override, lockfile, and install all agree (`pnpm install --frozen-lockfile` → "Already up to date"), closing the divergence. Note the `overrides` block is now **redundant**: `@fastify/swagger-ui` is a direct devDep only (fastify-zod-openapi lists it as an _optional_ peer, so it is not pulled transitively), so the block could be deleted entirely without changing the resolved tree — left in place per the maintainer's call.

### Nit

#### N1 — `DOM`/`DOM.Iterable` libs (and ESLint browser globals) are wider than the source needs

- **Files:** [`tsconfig.server.json`](../../../tsconfig.server.json) line 9, [`tsconfig.shared.json`](../../../tsconfig.shared.json) line 9, [`tsconfig.test.json`](../../../tsconfig.test.json) line 9; [`eslint.config.ts`](../../../eslint.config.ts) line 29 (`...globals.browser`)
- **Flagged by:** `node` (runtime target vs typed globals); configuration plan → _TypeScript configuration_ ("Library list (`lib`) matches the runtime target per scope") and _ESLint orchestration_; governing decision: ADR-0002 ([`docs/adr/0002-typescript-compiler-stance.md`](../../adr/0002-typescript-compiler-stance.md))
- **Why it matters:** This is **not** a challenge to the DOM-per-leaf topology — ADR-0002 settles that ("the root keeps a non-DOM library environment; each leaf widens it with the DOM libraries its source needs"), and the root correctly stays `["ESNext"]`. The nit is drift from the ADR's own qualifier: all three leaves add `DOM` + `DOM.Iterable`, but no source file actually uses a DOM type. A scan for DOM identifiers (`document`, `window`, `HTMLElement`, `querySelector`, …) across `app/` returned only false positives — a local variable named `document`, the string `"handover window"`, and `OpenAPIV3_1.Document` from `openapi-types`. All test projects run under `environment: "node"` and the server is Node-only (Fastify), so the DOM libs type browser-only globals (`document`, `window`, `localStorage`) as available in code that would throw `ReferenceError` at runtime. `eslint.config.ts` mirrors the same isomorphic assumption via `...globals.browser` (largely inert, since typescript-eslint disables `no-undef` for typed files, but consistent with the drift).
- **Suggested fix:** Narrow each leaf's `lib` to what its source needs — for the current Node-only tree, drop `DOM`/`DOM.Iterable` from `tsconfig.server.json`, `tsconfig.shared.json`, and `tsconfig.test.json` (leaving `["ESNext"]`), and drop `...globals.browser` from the ESLint `languageOptions.globals`. Re-add DOM to a leaf only when that leaf gains browser-targeted source, which is exactly the trigger ADR-0002 names. If shared code is intended to be isomorphic in advance of a future browser client, keep DOM on `shared` only and record that intent so it does not read as accidental. Purely advisory — the ADR permits the widening; this only flags that it currently exceeds need.

### Info

#### I1 — `engines.node: ">=26.0.0"` tracks the bleeding edge, coherently

- **File:** [`package.json`](../../../package.json) lines 69–71
- **Flagged by:** `node` (engines field); configuration plan → _Dependency hygiene_
- **Why it matters:** Node 26 is very recent, but the pin is internally coherent with the rest of the toolchain: the running runtime is `v26.5.0`, `@types/node` is `^26`, and ADR-0004 records the explicit "track the leading edge by hand" premise. Not a change request — just confirming the floor is intentional rather than a stray copy. Revisit only if code needs to run on an older LTS; nothing in scope currently uses a Node-26-only API that would _require_ this floor, so it is a policy pin, not a technical minimum.

## Strengths observed

- **pnpm supply-chain settings are a faithful, fully-commented implementation of ADR-0004** ([`pnpm-workspace.yaml`](../../../pnpm-workspace.yaml)): `minimumReleaseAge: 0` with an inline "revisit before any external release" tripwire, `blockExoticSubdeps: true` pinned so a future loosening is a visible diff, an explicit empty `allowBuilds: []`, `managePackageManagerVersions: true` paired with the `packageManager` pin for Corepack-free convergence, and the header note explaining the intentional absence of a `packages:` field. The lockfile carries no `git+`/`file:`/`link:` specifiers (verified), consistent with the exotic-subdep block.
- **Exact-pinning is uniform**, with the single `@types/node: "^26"` caret being the explicitly documented, types-only carve-out from ADR-0004 — not an oversight.
- **TypeScript topology precisely implements ADR-0002**: root is a non-DOM, `noEmit` solution file (`files: []`, minimal `include`, references to three composite leaves); each leaf sets `composite: true` with declaration-only emit and per-project build-info under the ignored `.tsc-cache`; `module: preserve` + `moduleResolution: bundler` + `erasableSyntaxOnly` + `verbatimModuleSyntax` + `isolatedModules` + `noUncheckedSideEffectImports` all align the checker with the type-stripping/bundler runtime. `allowImportingTsExtensions` is correctly left off (no `.ts`-extension imports exist in source — verified).
- **Strict superset** is on across the board (`strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`).
- **ESLint flat-config orchestration is well-formed**: `globalIgnores` first, an `extends` chain that puts the recommended sets up front and `eslint-config-prettier` last, `projectService: true` + `tsconfigRootDir` for type-aware resolution, and all scoped overrides (`**/*.config.ts`, `**/*.spec.{ts,tsx}`, the single-file assertion carve-out) at the tail where they win.
- **Dev-only Fastify plugins are placed and loaded correctly**: `@fastify/swagger` / `@fastify/swagger-ui` sit in `devDependencies` and are `await import(...)`-ed only inside an `isDevelopment` guard in the OpenAPI module, so they are never needed in a production install — a coherent devDep/dynamic-import pairing, not a miscategorisation.
- **Dependency hygiene holds**: every runtime `dependencies` entry (`axios`, `close-with-grace`, `dayjs`, `fastify`, `fastify-zod-openapi`, `gel`, `immutable`, `lodash-es`, `pid-port`, `pino`, `zod`) resolves to a real import in `app/`; `knip` is wired as the designated unused-dep detector (`obsolete` script) with correct `entry`/`project` globs and the `pino-pretty` transport ignore.
- **The `preinstall` guard** rejects non-pnpm package managers, backstopping `managePackageManagerVersions`.
- **Gates pass:** `pnpm typecheck` (`tsc -b`, from a cleared `.tsc-cache`) exits clean and `pnpm lint` (`--max-warnings 0`) exits clean.

## Out of scope

Cross-area leads surfaced for the reviewers who own them — not investigated here:

- **build-configs plan:** `vitest.config.ts` merges the shared Vite base via `mergeConfig(sharedConfig, …)` and imports [`.configs/vite/shared.config.ts`](../../../.configs/vite/shared.config.ts); the Vite-merge slice and the `.configs/vite/{server,shared}.config.ts` files themselves belong there.
- **build-configs plan (alias coherence):** the tsconfig `paths` aliases (`@configs/*`, `@server/*`, `@shared/*`) are mirrored by the ESLint `simple-import-sort` groups (`^@configs`, `^@server`, `^@shared`) in [`eslint.config.ts`](../../../eslint.config.ts) lines 146–158. The manifest side (the `paths` block) is clean; the cross-surface invariant that these stay in sync with the Vite `resolve` layer is a build-configs finding.
- **test-infra plan:** the runner-config bindings in `vitest.config.ts` — `setupFiles: [".configs/vitest/setup.ts"]`, `isolate: false`, `pool: "threads"`, `sequence.concurrent`, the `coverage` block, and the `--mode=debug` → `DEBUG_TEST_POLLUTION` env round-trip plus its throw guard (lines 10–24) — are the test-infrastructure wiring, reviewed under the test-infra/testing plans, not here.
- **Coverage:** I ran `typecheck` and `lint` but did not run the full `pnpm test` suite (parallel projects + coverage) — test execution and counts are the testing/test-infra plans' concern.
