# Code Review Plan: Project Configuration

## Scope

Build, runtime, and package-manager configuration that governs how the codebase compiles, runs, and resolves modules. Concerns include:

- Package manifest and dependency hygiene
- pnpm-specific configuration (workspace settings, supply-chain defaults)
- TypeScript compiler options and path aliases
- Vite configuration for runtime transforms (vite-node) and future client/SSR builds
- The relationship between tsconfig paths, package.json subpath imports, and Vite alias resolution

This is the **tooling boundary**: changes here can silently break dev, prod builds, or type-checking, while never showing up in feature code.

## Files currently in scope

- `package.json` (deps, scripts, `imports` field, `engines`, `packageManager`)
- `pnpm-workspace.yaml` (pnpm settings — even in single-package projects this is where pnpm config lives in v11+)
- `tsconfig.json` (compiler options, paths, module resolution)
- `vite.config.ts` (Vite resolve options, opt-in to built-in tsconfig-paths support)

## Required skills

| Skill                     | Why                                                                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                                                                                       |
| `pnpm`                    | pnpm v11 settings live in `pnpm-workspace.yaml`; supply-chain defaults (`minimumReleaseAge`, `blockExoticSubdeps`) and dep-build settings are non-obvious |
| `vite`                    | Vite resolver behaviour, Environment API readiness, plugin ordering, opt-in flags like `resolve.tsconfigPaths`                                            |
| `node`                    | ESM resolution semantics, `type: module`, `engines` field, top-level await support, Node 24 type-stripping interaction with Vite                          |

## Review focus

### Dependency hygiene

- Every direct dep is actually imported somewhere; tree-shaking can't compensate for unused runtime deps in `dependencies`
- Dev-only tools (Vite, vite-node, types) are in `devDependencies`, not `dependencies`
- A package imported via `import { x } from "pkg"` must be a **direct** dep — pnpm's strict node_modules won't surface transitive deps for app-code imports (even if they appear in the lockfile)
- `engines.node` matches the minimum Node version that the code actually requires (e.g. Node 24+ if using stable type-stripping)
- `packageManager` is pinned so contributors can't accidentally use the wrong pnpm version

### pnpm settings

- `pnpm-workspace.yaml` is the location for pnpm settings in v11; not `.npmrc` (which is auth/registry only now)
- Supply-chain overrides (e.g. `minimumReleaseAge`) are intentional and documented (a comment or doc explaining why it's overridden from the safe default of 1440)
- `blockExoticSubdeps` defaults to `true`; overriding to `false` warrants a comment explaining the risk accepted
- Build-script allowlist (`allowBuilds` in v11) is explicit — packages with native build scripts are listed, nothing else can run install scripts
- `onlyBuiltDependencies` / `neverBuiltDependencies` (legacy) are migrated to `allowBuilds`

### TypeScript configuration

- `strict: true` is on; targeted opt-outs (e.g. `noUnusedLocals: false`) have a reason
- `moduleResolution: "bundler"` pairs with `module: "preserve"` (or `"esnext"`); not `"nodenext"`
- Paths in `tsconfig.paths` mirror any package.json `imports` mapping (or one of the two is the single source of truth)
- `allowImportingTsExtensions` is on only if `.ts` extensions actually appear in source imports
- `noEmit: true` for projects that don't build (vite-node runtime)
- Library list (`lib`) matches the runtime target

### Vite configuration

- `resolve.tsconfigPaths: true` opts in to Vite's built-in tsconfig-paths resolution (no need for `vite-tsconfig-paths` plugin in Vite 6+)
- The config does **not** `import` from `"vite"` if `vite` isn't a direct dep — pnpm's strict node_modules will fail; a plain object export sidesteps this entirely (`defineConfig` is just a type helper)
- Plugin order is reviewed when plugins exist (the first plugin to claim a request wins)
- For future client/SSR work: the Environment API (`environments: { client, ssr }`) is the modern shape; flag adoption when a client is introduced

### Module resolution coherence

- The same alias means the same thing in: tsconfig paths, package.json imports (if used), Vite resolve, runtime resolver. If they diverge, IDE will lie to you.
- Subpath imports starting with `#` are package.json-only — those work natively in Node and Vite; aliases starting with `@`, `~`, etc. need either tsconfig paths + Vite resolve config, or a plugin
- Removing one alias source must remove all of them, or the others become dead config

### Scripts

- The `dev` script invokes a real runtime; verify the binary exists in deps and the entry path actually starts the server (a Vite dev-server-only invocation will silently start Vite and never start Fastify)
- Lint/typecheck/test scripts (when present) reference the right configs (`vitest.config.ts`, `eslint.config.ts`, etc.)

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
- `tsconfig.json` or any sibling tsconfig (e.g. a `tsconfig.server.json` if you split for production builds)
- `vite.config.ts` or any Vite plugin add/remove
- `pnpm-lock.yaml` (review the diff for unexpected resolutions, downgrade attacks, exotic specifiers)

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
