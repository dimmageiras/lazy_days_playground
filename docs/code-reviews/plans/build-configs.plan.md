# Code Review Plan: Build Configs

## Scope

The Vite shared base plus the per-runtime Vite configs that compose on top of it, and the cross-surface invariant that keeps module-resolution aliases coherent. The defining property: changes here can silently break dev, type-checking, or the bundle without any failing test — the build pipeline succeeds and ships the wrong thing. Concerns include:

- The shared base + per-runtime composition pattern, and the `mergeConfig` rules that make it compose
- `resolve.conditions` partitioning between runtimes (Node-side vs browser-side) and the array-concatenation footgun in `mergeConfig`
- The opt-in to Vite's built-in tsconfig-paths resolution and what that pre/post-version surface looks like
- `satisfies UserConfig` discipline on per-runtime configs so type-checking succeeds without losing the literal-narrowed object form `mergeConfig` requires
- **Alias coherence** as a cross-surface invariant — the same alias must mean the same thing in the TypeScript paths block, the Vite resolve layer (driven by the same paths block), and the ESLint import-sort groups

The decision behind this layout — one shared base plus one config per runtime — is recorded as an ADR; the pattern document next to it describes the layout in full. See [Related](#related) below.

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement.

- `.configs/vite/shared.config.ts` (the shared base — owns keys both runtimes pay for: resolve options, the opt-in to built-in tsconfig-paths resolution, any plugin/define defaults)
- `.configs/vite/server.config.ts` (per-runtime Node-side config layered on the shared base via `mergeConfig`)
- `.configs/vite/<runtime>.config.ts` (any additional per-runtime config that lands later, layered on the shared base via the same composition pattern)
- `vite.config.ts` at the repo root (forward-looking client entry — applies once the React Router framework-mode client lands; the root location is where Vite's default config discovery looks)
- `vitest.config.ts` (test-runner config that merges the shared Vite base; the runner-specific surface lives in the testing plan, the Vite-merge surface is reviewed here)
- `tsconfig.json` `paths` block (canonical alias definition — the Vite shared base consumes it via the built-in tsconfig-paths opt-in)
- `eslint.config.ts` import-sort group definitions (the alias-prefix groups that must stay coherent with the paths block)

## Required skills

| Skill                     | Why                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                                                                                        |
| `vite`                    | `mergeConfig` semantics, `resolve.conditions` array merging, Environment API readiness, plugin ordering, the built-in tsconfig-paths opt-in                |
| `typescript-magician`     | `satisfies UserConfig` on per-runtime configs, generic parameters on `defineConfig`, the literal-vs-widened-object distinction that `mergeConfig` requires |

## Review focus

### Composition pattern — shared base + per-runtime configs

- The shared base exports a plain Vite config that owns the keys both runtimes pay for. Per-runtime configs import the base and layer their concern on top via `mergeConfig` from `vite`.
- A per-runtime config never duplicates a key that already lives in the shared base — duplicate keys silently win or lose depending on `mergeConfig`'s rules per shape (objects deep-merge, arrays concatenate), making the result non-obvious from reading either file alone.
- Each per-runtime config reads on its own. Opening one config and seeing only that runtime's concerns is the rename-test for the layout (see [`CONTEXT.md`](../../../CONTEXT.md#rename-test)).
- Adding a third runtime is mechanical: a new `<runtime>.config.ts` next to the shared base, composing from it via `mergeConfig`. Plans that propose folding multiple runtimes into a single `mode`-branched config regress the layout — flag.

### `mergeConfig` arity and source-type guard

- `mergeConfig(base, override)` takes a `UserConfig` object literal as the second argument. Passing a function that returns a config (rather than the resolved config object) silently yields `{}` for the override side, and the per-runtime overrides are lost. The runtime still produces a config — the bug is invisible to type-checking.
- `defineConfig(({ command, mode }) => mergeConfig(base, override))` is the correct shape when the per-runtime config needs the build context. The function wraps the **outer** call, not the second argument to `mergeConfig`.
- The second argument carries `satisfies UserConfig` so a typo in a nested key fails at type-check time. A bare object literal at that position is a missed safety net; `as UserConfig` (assertion rather than satisfaction) widens the literal and lets typos through silently.

### `resolve.conditions` partitioning

- `mergeConfig` concatenates arrays — including `resolve.conditions`. A `["browser"]` entry in the shared base would leak into the server config as `["browser", "node"]`, and the first matching condition wins. The server then resolves a browser-conditional export from a multi-environment package, which type-checks and may even run in dev (the browser export is often a superset) but silently misroutes at SSR or in prod.
- The rule: keep `resolve.conditions` **out of the shared base**. Each runtime layers its own conditions in its own per-runtime config. The shared base owns conditions only if both runtimes truly agree on every entry — which is rare enough that the safe default is "never."
- A condition added to one runtime that should also apply to a second runtime is added explicitly to that second runtime's config, not relocated to the base — explicit duplication beats a leaky merge.

### Built-in tsconfig-paths resolution

- `resolve.tsconfigPaths: true` in the shared base opts in to Vite's built-in tsconfig-paths resolution — the same `paths` block that TypeScript reads becomes the alias map Vite uses. The shared base is the only place this opt-in belongs.
- The capability is built into Vite 8 and later. Pre-8 projects need an external plugin to achieve the same effect; the plan does not name the plugin because the project is on 8+ today. A backport that drops to a pre-8 line and keeps the boolean opt-in will silently no-op the alias resolution.
- The opt-in eliminates the need to mirror `paths` in `resolve.alias` — flag any addition of an explicit `resolve.alias` block alongside the opt-in, since the two surfaces compete and the explicit alias wins.

### `satisfies UserConfig` discipline

- Both the shared base and every per-runtime config carry `satisfies UserConfig` on the object literal passed to `defineConfig` / `mergeConfig`.
- `satisfies` checks the shape without widening the literal — `mergeConfig` needs the narrow literal to deep-merge correctly, and `satisfies` is what gives both safety and the narrow shape together.
- `as UserConfig` is a regression: it widens the literal, hides typos, and gives `mergeConfig` a wider type that loses the literal narrowing.
- `defineConfig(...)` is itself a type helper — flag any per-runtime config that drops `defineConfig` in favour of a bare object export. The helper is what surfaces inference errors at the source rather than at the call site.

### Alias coherence — cross-surface invariant

The alias scheme lives in **three surfaces** that must agree. A rename or addition that touches only one surface is a regression — the others become dead config or, worse, silently disagree.

- **TypeScript `paths` block** — the canonical definition. Every `@<prefix>/*` alias is declared here.
- **Vite resolve layer** — driven by the same paths block via the built-in tsconfig-paths opt-in in the shared base. Renaming a prefix here without renaming it in the paths block does nothing in Vite (the opt-in re-reads the paths block); renaming it in the paths block automatically flows through Vite.
- **ESLint `simple-import-sort` groups** — alias prefixes appear as grouping anchors. A new alias must be added to whichever group it should sort into; a rename must follow. Missing here means imports sort to a fallback group and the file's import order silently shifts on the next save.

The review test: pick one alias prefix and `grep` for it across `tsconfig.json`, the Vite shared base (implicit — via the opt-in), and the ESLint flat config. If the three pictures diverge, the surface that disagrees is the finding.

### Forward-looking — the client config

The repo-root `vite.config.ts` is **anticipated, not yet present**. When it lands, it plugs into this layout as another per-runtime config layered on the shared base — same composition rule, same `satisfies UserConfig` discipline, same alias-coherence requirement. Until then, plans that flag its absence regress the project's intentional posture.

When the client config does land, this section gains:

- Client-side `resolve.conditions` (`browser` for the client environment) layered only in the client config.
- React Router's framework-mode Vite plugin entry in the client config's plugin array.
- A note on the dev-time mount point (the client config is consumed by a programmatic Vite server inside the Fastify init flow, not by a separate CLI process).

### Test-runner config interaction

- The test-runner config is reviewed for its **Vite-side composition** here (it merges the shared Vite base via `mergeConfig` from `vite`, not from `vitest/config`'s re-export). The runner-specific surface — coverage, isolation, sequence, setup files, helper layer — lives in the testing and test-infra plans.
- The shared base is imported once at the top of the runner config and merged exactly like a per-runtime config. Any divergence (e.g. importing only `resolve.tsconfigPaths` and leaving the rest of the base behind) is a finding.

## When to run this plan

A PR that:

- Adds, modifies, or restructures any file under `.configs/vite/**`
- Adds the repo-root `vite.config.ts` or changes how it composes on the shared base
- Changes the Vite or `vite-node` major version
- Adds, renames, or removes an entry in the TypeScript `paths` block
- Reshapes the ESLint `simple-import-sort` groups (a finding that those groups disagree with the paths block belongs here; the broader flat-config orchestration belongs in the configuration plan)
- Touches the Vite-merge surface of `vitest.config.ts`

## Related

- [ADR-0001](../../adr/0001-vite-multi-target-config.md) — the decision behind the shared-base + per-runtime layout and the alternatives weighed.
- The Vite pattern doc next to the ADR — describes the layout, what each runtime needs from Vite, dev vs prod runtime flow, and the externals/output-collision footguns.
- [`./configuration.plan.md`](./configuration.plan.md) — package manifest, pnpm-workspace, TypeScript compiler options, ESLint flat-config orchestration (this plan owns only the alias-coherence slice of the ESLint config).
- [`./testing.plan.md`](./testing.plan.md) and [`./test-infra.plan.md`](./test-infra.plan.md) — the runner-specific concerns this plan defers to.

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
