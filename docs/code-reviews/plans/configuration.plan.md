# Code Review Plan: Project Configuration

## Scope

Build, runtime, and package-manager configuration that governs how the codebase compiles, runs, and resolves modules — the **tooling boundary**. Changes here can silently break dev, prod builds, or type-checking without showing up in feature code. Concerns include:

- Package manifest and dependency hygiene
- pnpm-specific configuration (workspace settings, supply-chain defaults)
- TypeScript compiler options as JSON manifests — the extends graph, target/lib/module choices, and the `paths` block as the canonical source of truth for the alias scheme
- ESLint flat-config orchestration — plugin registration, parser options, scoped overrides
- The test-runner config as a configuration artefact (the runner-side bindings; the test-infrastructure surface it wires in lives in its own plan)
- Git or lint hooks (when present)

The Vite shared base, the per-runtime Vite configs, and the cross-surface alias-coherence invariant (tsconfig paths ↔ Vite resolve ↔ ESLint import groups) are owned by [`./build-configs.plan.md`](./build-configs.plan.md). This plan only touches the alias scheme as it lives in the TypeScript `paths` block; the build-configs plan reviews how that block flows through Vite and ESLint.

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement.

- `package.json` (deps, scripts, `imports` field, `engines`, `packageManager`)
- `pnpm-workspace.yaml` (pnpm settings — even in single-package projects this is where pnpm config lives in v11+)
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.test.json` (solution-style — root is the entry point, siblings are referenced; operational hints, file names may move)
- `eslint.config.ts` (flat-config orchestration — plugin registration, parser options, scoped overrides)
- `vitest.config.ts` (test-runner config — reviewed here for its runner-side bindings; the Vite-merge slice belongs to the build-configs plan, the test-infra slice it wires in belongs to the test-infra plan)
- `.husky/**`, `lint-staged` field in `package.json`, or equivalent git-hook config (when present)

## Required skills

| Skill                     | Why                                                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                                                                                       |
| `pnpm`                    | pnpm v11 settings live in `pnpm-workspace.yaml`; supply-chain defaults (`minimumReleaseAge`, `blockExoticSubdeps`) and dep-build settings are non-obvious |
| `node`                    | ESM resolution semantics, `type: module`, `engines` field, top-level await support, version-stripping interaction with the bundler                        |

## Review focus

### Dependency hygiene

- Every direct dep is actually imported somewhere; tree-shaking can't compensate for unused runtime deps in `dependencies`
- Dev-only tools (bundlers, test runners, types) are in `devDependencies`, not `dependencies`
- A package imported via `import { x } from "pkg"` must be a **direct** dep — pnpm's strict node_modules won't surface transitive deps for app-code imports (even if they appear in the lockfile)
- `engines.node` matches the minimum Node version that the code actually requires (e.g. Node 26+ if the code uses Node 26-only APIs, type-stripping flags, or runtime features)
- `packageManager` is pinned so contributors can't accidentally use the wrong pnpm version

### pnpm settings

- `pnpm-workspace.yaml` is the location for pnpm settings in v11; not `.npmrc` (which is auth/registry only now)
- Supply-chain overrides (e.g. `minimumReleaseAge`) are intentional and documented (a comment or doc explaining why it's overridden from the safe default of 1440)
- `blockExoticSubdeps` defaults to `true`; overriding to `false` warrants a comment explaining the risk accepted
- Build-script allowlist (`allowBuilds` in v11) is explicit — packages with native build scripts are listed, nothing else can run install scripts
- `onlyBuiltDependencies` / `neverBuiltDependencies` (legacy) are migrated to `allowBuilds`

### TypeScript configuration (JSON manifests)

The tsconfigs are reviewed as **JSON manifests** that govern the type-checker and the language service. The way `paths` flows through the bundler and the linter is a cross-surface concern owned by [`./build-configs.plan.md`](./build-configs.plan.md); only the manifest side is reviewed here.

- `strict: true` is on; targeted opt-outs (e.g. `noUnusedLocals: false`) have a reason.
- The extends graph is shallow and explicit — a base tsconfig at the root, sibling tsconfigs referenced from it for app and test scope. The root is the entry point; siblings carry the per-scope overrides.
- `moduleResolution: "bundler"` pairs with `module: "preserve"` (or `"esnext"`); not `"nodenext"` when a bundler is in the loop.
- Paths in the `paths` block mirror any package.json `imports` mapping (or one of the two is the single source of truth). The `paths` block is the **canonical alias definition** — adding, renaming, or removing an alias here triggers the cross-surface invariant the build-configs plan owns.
- `allowImportingTsExtensions` is on only if `.ts` extensions actually appear in source imports.
- `noEmit: true` for projects that do not produce a build artefact (the type-checker is the only emitter, and the test runner imports source directly).
- Library list (`lib`) matches the runtime target per scope — app scope may add DOM/DOM.Iterable; the base does not.
- Value imports and type-only imports from the same module stay on separate `import` statements — the type-only line uses `import type { … }`, the value line uses the standard form. The separation keeps the intent visible at a glance and survives `verbatimModuleSyntax` without depending on inline-modifier emit semantics.

### ESLint flat-config orchestration

- The config is the flat array shape: an ignore entry, then one or more configuration objects, each scoped by a `files` glob where appropriate.
- Plugin registration happens via the `plugins` field on the configuration object; the `extends` array (in the flat-config form) pulls in the recommended sets at the top of the chain.
- Parser options include `tsconfigRootDir` and `projectService` for type-aware rules to resolve correctly under the bundler-style module resolution.
- Scoped overrides (`*.spec.ts(x)`, `*.config.ts`, `*.d.ts`) live as their own entries at the tail of the array — overrides at the head get overridden by the broader entries that follow.
- The cross-surface alias-coherence invariant (import-sort group definitions vs the tsconfig `paths` block vs the bundler resolve layer) is reviewed under [`./build-configs.plan.md`](./build-configs.plan.md). This plan reviews the orchestration; the alias-prefix coherence is a build-configs finding.

### Test-runner config

- The test-runner config sits in this plan only as a **configuration artefact** — that a config file exists, that it consumes the right binary, that its `extends`/`include` paths resolve.
- The Vite-merge surface (importing and merging the shared Vite base via `mergeConfig`) is reviewed under [`./build-configs.plan.md`](./build-configs.plan.md).
- The runner-config bindings that wire in the test infrastructure (the setup file entry, the mode → env mapping, the coverage configuration, the isolate/concurrency posture) are reviewed under [`./test-infra.plan.md`](./test-infra.plan.md) (for the infrastructure side) and [`./testing.plan.md`](./testing.plan.md) (for the spec-author side).

### Module resolution coherence

- The same alias must mean the same thing across every surface that resolves it. The TypeScript `paths` block is the canonical definition; how it flows through the bundler and the linter is reviewed under [`./build-configs.plan.md`](./build-configs.plan.md).
- Subpath imports starting with `#` are package.json-only — those work natively in Node and the bundler. Aliases starting with `@`, `~`, etc. need either tsconfig paths + bundler resolve config, or a plugin.
- Removing one alias source must remove all of them, or the others become dead config — the build-configs plan owns the cross-surface enforcement; this plan flags an orphaned entry in the `paths` block.

### Scripts

- Lint, typecheck, and test scripts reference the right configs — each binary the script invokes is in `devDependencies`, and each config path resolves.
- Scripts (when added) that invoke a runtime entry point are reviewed under "Scripts (when a runtime is added)": verify the binary exists in deps and the entry path actually starts the intended process, not a side-runtime (e.g. a dev-server-only invocation silently starting the bundler and never starting the server).
- Each script's purpose is distinct: duplicates or near-duplicates without a stated reason are review findings.

### Git/lint hooks (when present)

- A Husky or equivalent hook layer is reviewed as a configuration artefact — the hook binary is in `devDependencies`, the hook script invokes the project's lint/format/typecheck binaries (not a sibling-language tool), and the hooks are skippable in CI (CI re-runs the same checks centrally).
- A `lint-staged` field (or equivalent) targets only the file types the project's linters can actually process.

### Security

- `minimumReleaseAge: 0` (allow 0-day packages) is intentional and acknowledged as a risk in dev-only contexts
- No secrets in `package.json` or any committed config (tokens, keys, internal URLs)
- `.npmrc` is checked for auth — if present, only registry/auth entries belong there in v11

### Lockfile

- `pnpm-lock.yaml` is committed and up to date — `pnpm install --frozen-lockfile` should pass in CI
- The lockfile contains no `git+` or `file:` URLs unless `blockExoticSubdeps: false` is set with reason

## When to run this plan

A PR that touches:

- `package.json` (any field)
- `pnpm-workspace.yaml`, `.npmrc`, `~/.config/pnpm/config.yaml` (when project-relevant)
- `tsconfig.json` or any sibling tsconfig (e.g. a `tsconfig.server.json` if you split for production builds) — the manifest side; cross-surface alias flow goes to [`./build-configs.plan.md`](./build-configs.plan.md)
- `eslint.config.ts` (orchestration; import-sort group coherence goes to [`./build-configs.plan.md`](./build-configs.plan.md))
- `vitest.config.ts` (configuration-artefact side; the Vite-merge slice goes to [`./build-configs.plan.md`](./build-configs.plan.md), the infra-wiring slice goes to [`./test-infra.plan.md`](./test-infra.plan.md))
- Git/lint hook config (when present)
- `pnpm-lock.yaml` (review the diff for unexpected resolutions, downgrade attacks, exotic specifiers)

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
