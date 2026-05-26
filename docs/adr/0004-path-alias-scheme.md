# 0004. Path-alias scheme as a cross-surface invariant

- **Status:** Proposed
- **Date:** 2026-05-26

## Context

Several tools in this project resolve module specifiers independently: the TypeScript language service (and `tsc -b`) reads `tsconfig.json` paths; Vite resolves at bundle and dev-server time; the ESLint import-sort plugin classifies imports into ordered groups for the auto-fix; the unit-test runner inherits Vite's resolution. Each tool has its own mechanism for declaring shortcuts to internal modules, and each tool's mechanism is independently expressive enough to drift from the others.

The codebase needs a single internal-import notation that every one of those tools recognises, so that a contributor writing `import … from "@something/x"` gets identical behaviour from the editor, the bundler, the linter's ordering, and the test runner — and so a refactor that adds, renames, or removes a top-level concept area only changes one canonical place per surface, not four places that can disagree.

Node 22+'s `package.json#imports` field offers a runtime-level alternative — `#`-prefixed subpath imports the Node module resolver recognises natively, no tooling required. That alternative is real and worth considering; the decision below picks against it deliberately.

## Decision

The project uses an **alias-prefix scheme** for internal imports — `@<area>/*` notations where each area maps to one top-level directory.

- The mapping is declared once in the root TypeScript config's `paths` block.
- Vite picks the same mapping up via its built-in `tsconfigPaths` resolver option in the shared base; both runtimes (server config and the planned client config) inherit it.
- ESLint's import-sort groups recognise the same prefixes so the auto-fix orders external, alias-prefixed, and relative imports into a stable sequence.

The three surfaces — TypeScript paths, the Vite resolver, the ESLint sort groups — are treated as a **single invariant**: adding, renaming, or removing an alias is one change applied to all three in the same commit. `package.json#imports` `#`-subpaths are explicitly rejected as the alternative scheme.

## Alternatives considered

### `package.json#imports` (`#`-prefixed subpath imports)

Node-native, no tooling required to resolve at runtime. Rejected because the project's resolution pipeline is not Node-native — Vite owns dev-time resolution, the TS language service owns editor resolution, and the test runner runs on top of Vite. `#`-subpaths would need parallel mirrors in the TS paths block and the Vite resolver anyway, while losing the prefix shape ESLint's import-sort already keys on. The runtime-level advantage does not apply to a stack where no surface resolves through Node directly.

### Plain relative paths everywhere (no aliases)

Drop the alias scheme; let every import be `../../../shared/x`. Rejected because the project already restricts deep relative chains via an ESLint rule and because relative paths re-couple imports to current file location — a move from one directory to another rewrites every transitive importer, defeating the rename-test discipline the docs apply elsewhere.

### Per-tool alias declarations (no shared source of truth)

Declare aliases independently in each tool's config (TS paths, a Vite `resolve.alias` block, an ESLint settings block) without a single source. Rejected on drift grounds: three independent maps will diverge the first time an alias is renamed, and the failure mode — the linter sorting under one map, the bundler resolving under another — is silent until it isn't.

### One-way mirror with TS paths as the source

Keep TS paths canonical and re-declare in Vite and ESLint by hand. Rejected because the Vite resolver can read TS paths directly via the built-in `tsconfigPaths` option, removing one of the two redundant declarations entirely. The ESLint sort groups still have to know the prefixes by name, but matching a prefix shape is not the same as duplicating the full mapping.

## Consequences

- **One canonical declaration for the alias map.** The TS paths block is the source; the Vite shared base reads it; the ESLint sort groups recognise the prefixes by shape. A new alias is added in the TS config and the ESLint group list; the Vite resolver picks it up automatically.
- **The three-surface invariant is part of every refactor that touches an area.** Renaming a top-level directory means changing the alias name in the TS config and the ESLint group list together; missing either surface is a review-grade defect.
- **Import-sort behaviour is predictable.** External packages, alias-prefixed internals (with the order the project picks for its prefixes), Node-builtin side-effect imports, and relative imports each go into their own group, and the auto-fix produces a stable order every run.
- **Editor, lint, bundler, and tests all see the same shortcut.** A `@<area>/x` import resolves identically wherever it appears; a contributor never has to remember which tool's mechanism they're talking to.
- **Adding a new top-level area is a deliberate act.** It requires updating the TS paths block, the ESLint sort groups, and any docs that enumerate the alias scheme — there is no "pick up the new prefix automatically" shortcut, which is the desired friction (a new area is a load-bearing change).
- **`#`-subpath imports do not appear in this codebase.** A future contributor adding one is making a scheme change, not a per-import choice; the change is an ADR update, not a code review nit.

## Related

- [ADR-0001](./0001-vite-multi-target-config.md) — the multi-target Vite layout that the shared base (and therefore the alias resolution) sits on.
- [ADR-0008](./0008-typescript-strict-stance.md) — the TypeScript strict stance set in the same root config that owns the alias `paths` block.
- [`../../.claude/rules/state-management.md`](../../.claude/rules/state-management.md) and other project rules — examples of docs that lean on the alias prefixes when illustrating import shapes.
- [`../code-reviews/plans/configuration.plan.md`](../code-reviews/plans/configuration.plan.md), [`../code-reviews/plans/build-configs.plan.md`](../code-reviews/plans/build-configs.plan.md) — review criteria that enforce the cross-surface invariant.
