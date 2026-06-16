# 0002. TypeScript compiler stance: solution project references, strict-superset flags, and the bundler/erasable module mode

- **Status:** Accepted
- **Date:** 2026-06-16

## Context

The runtime strips TypeScript types on demand and runs the source directly; there is no compiler-emitted JavaScript build for the server. In that world the compiler is not a code generator — it is a type-checker validating code that some other tool will run after erasing the types. Nothing in the running process consumes compiler output.

That framing fixes three coupled questions, all answered in one shared compiler configuration:

- **Who owns type checking, and how is it scoped fast?** The codebase has two compilation audiences — application source, and test plus tooling source — with different ambient libraries and different file sets. They share most options but diverge on what they own. A single flat config forces one library environment and one include set on both, and re-checks the whole tree every run.
- **How strict?** The `strict` flag is a moving bundle of safe defaults that deliberately omits a stricter tier of correct-but-disruptive checks. Each omitted flag is free to satisfy while writing fresh code and becomes a tree-wide remediation sweep once code relies on the looser behaviour. "Later" is the most expensive time to turn any of them on.
- **Which module semantics?** A default compiler accepts module forms and TypeScript-only constructs the stripping runtime cannot execute — constructs that generate runtime code, and import shapes the bundler-style resolver would reject. If the checker's notion of a runnable module drifts from the stripper's, the green check stops meaning anything.

## Decision

One root compiler configuration sets a single stance, inherited by every downstream project through configuration `extends` so no project can quietly relax it. The stance has three facets.

**1. Build topology — solution-style composite project references.** Type checking runs through the compiler in build mode over a solution layout. The root config is a **solution file**: it compiles none of the application or test sources itself (empty `files`, a minimal `include` limited to the few root-level tool config files) and delegates to two referenced composite sub-projects — an **app project** scoped to application source, excluding specs, and a **test project** scoped to the test-infrastructure config, the specs, the runner config, and the app project's declaration outputs, with a project reference to the app project so cross-project types resolve through declarations. Both sub-projects set `composite: true`; both override the base no-emit posture to **declaration-only** emit (the only place emit is re-enabled). The root keeps a non-DOM library environment; each leaf widens it with the DOM libraries its source needs. Declaration output and per-project incremental build-info are written under a dedicated, version-control-ignored cache directory (one sub-path per project). That output exists **solely to satisfy the composite/incremental contract** — it lets build mode track staleness and skip unchanged projects, and lets the test project consume the app project's types across the reference boundary. No runtime JavaScript is ever produced; the runtime path never reads any compiler output.

**2. Strictness — a strict superset.** `strict` is on, and on top of it the project opts into the stricter checks TypeScript leaves off:

- **Unchecked index access is possibly-missing.** Reading an element by index or a record by dynamic key yields a value that may be `undefined` and must be guarded or narrowed — closing the most common silent gap in `strict`.
- **Optional and `undefined` are distinct.** An absent property and one explicitly set to `undefined` are different types; `undefined` cannot be assigned to satisfy an optional field, keeping "missing" and "present but empty" from collapsing.
- **Overrides are explicit.** A member overriding a base member must say so, so base rename or signature drift surfaces as an error instead of silently producing an unrelated member.
- **Switch fall-through is an error.** A non-empty `case` falling into the next without a terminator is rejected.
- **Side-effect imports are checked.** A bare side-effect import is resolved and type-checked rather than waved through.

**3. Module semantics — bundler-oriented, no-emit, erasable-only.** The compiler is configured for a type-stripping world, not for emitting JavaScript:

- **Module semantics follow the bundler.** Module emit is preserve and resolution is the bundler algorithm, so the checker resolves imports the same way the runtime resolver does. Module detection is forced, so every file is an ES module regardless of top-level syntax.
- **No runtime JavaScript is emitted.** Type checking is the product. (Declaration-only emit for project references, facet 1, is the sole, separate exception.)
- **Every module is safe to type-strip.** Erasable-syntax-only mode bans constructs that require code generation — enumerations, runtime-bearing namespaces, parameter properties — so erasing the types always leaves runnable code.
- **Import/export intent is explicit and verbatim.** Verbatim module syntax forces type-only imports and exports to be marked rather than inferred and elided, so the stripper never guesses an import's runtime side-effect status. Isolated-modules mode guarantees each file transpiles alone — the unit a stripper operates on.
- **Host interop for default/namespace imports is enabled** so common third-party module shapes resolve under the bundler model; **source imports stay extensionless** (the option that would permit importing a typed path is deliberately left unset), keeping specifiers resolver-driven.

The compiler defines what code may express; a type-aware lint layer reinforces the same discipline at call sites the compiler alone would let through — the no-unsafe family rejects operations on `any`-typed values, an explicit-module-boundary-types rule forces annotated boundaries, and a consistent-type-imports rule re-enforces the type-only import separation. The compiler is the load-bearing half; the linter keeps it honest where a flag is momentarily forgotten in review.

## Alternatives considered

- **Let the bundler/runtime be the type checker.** Rejected. The transform step strips types rather than checking them, so errors would surface late or never, with no project-graph incrementality. A dedicated checker keeps a real type-checking gate independent of how code runs.
- **A single non-composite flat config.** Rejected. One config cannot give the application and test/tooling audiences different library environments or include sets without compromise, and re-checks the entire tree every run. The solution-plus-references layout scopes each audience and skips unchanged projects.
- **Composite projects with full JavaScript emit.** Rejected. Composite mandates emit, but emitting runtime JavaScript creates a second, divergent build artifact nothing consumes — dead output that invites confusion about which path runs. Declaration-only emit satisfies the contract at minimum cost.
- **Plain `strict`, nothing more.** Rejected. It leaves the second tier off, and the gaps it tolerates — unguarded index access, conflated optional-vs-`undefined`, silent override drift, switch fall-through, unchecked side-effect imports — are exactly the cheap-now, expensive-later defects.
- **Adopt the extra strictness flags later.** Rejected. Each flag is free to satisfy on fresh code and turns into a tree-wide error sweep once code depends on the looser behaviour.
- **Lint rules instead of compiler flags for strictness.** Rejected. These are type-level guarantees, not style preferences — a compiler flag changes the types a program may form; a lint rule only flags recognised patterns and is suppressible per line. The two are complementary, used together, but the compiler is load-bearing.
- **Node-next module resolution and emit.** Rejected. It models a Node-resolved, compiler-emitted package world, changing which import forms are legal (explicit extensions, conditional-exports semantics) across every file and reintroducing the gap between what type-checks and what the stripping runtime runs. The point is to align with the bundler resolver the runtime uses.
- **Allow non-erasable constructs (drop erasable-syntax-only).** Rejected. Enumerations, runtime namespaces, and parameter properties emit code; a pure stripper does not, so they type-check and then fail at runtime. Banning them turns a latent runtime failure into a compile-time error.
- **Let the compiler infer and elide type-only imports (drop verbatim module syntax).** Rejected. Inference makes an import's runtime side-effect status implicit; a wrong guess under stripping is either a dropped side effect or a dangling runtime reference. Explicit marking removes the guess.
- **Permit typed-path extensions on imports.** Rejected, to keep specifiers extensionless and resolver-driven, avoiding a second divergent way to write the same import.

## Consequences

**Positive**

- Type checking is a single build-mode command with project-graph incrementality: unchanged projects are skipped via per-project build-info.
- The application and test/tooling audiences get independent library environments and file scopes while sharing one root config; cross-project types resolve through generated declarations at a clean reference boundary.
- Correctness is decoupled from the runtime — the checker fails the build on type errors regardless of how, or whether, code is bundled or executed.
- A class of defects (unguarded index access, missing-vs-`undefined` confusion, override drift, switch fall-through, unchecked side-effect imports) is caught at compile time; the strictness is paid for once, while free, instead of deferred into a migration that never gets prioritised.
- The checker's notion of a valid, runnable module matches the stripping runtime's: a file that type-checks is a file the runtime can strip and run, with compile-time errors for compile-but-don't-strip constructs and unambiguous import side-effect status in source.
- A single root declaration plus inheritance holds the whole stance uniformly; the lint layer reinforces it at call sites the compiler alone would permit.

**Accepted negative**

- The build topology is non-obvious: a reader meeting composite together with declaration-only emit may assume a real runtime artifact and look for output nothing consumes — this ADR is the explanation. The cache directory must stay version-control-ignored and is safe to delete (it rebuilds). Adding a third audience means another referenced project wired into the solution file and its dependents — more moving parts than a flat config.
- Everyday code carries more ceremony: index and record reads need a guard or narrowing; optional fields cannot be satisfied with `undefined`; type-only imports carry explicit annotation an inferring compiler would hide. Contributors cannot reach for enumerations, runtime namespaces, or parameter properties and must use erasable equivalents.
- The stance is global, load-bearing, and effectively a one-way door: relaxing a strictness flag after code accumulates reintroduces the same tree-wide cost, and moving to a Node-resolved or compiler-emitted model is not a local edit — it changes which import forms and constructs are legal in every file.
- New contributors and agents must internalise that the compiler is stricter than `strict` and bound to bundler/stripping semantics — a small but real onboarding tax.

## Related

- [`./0001-vite-multi-target-and-dev-runtime.md`](./0001-vite-multi-target-and-dev-runtime.md) — the type-stripping dev runtime and the no-production-build posture this compiler stance is decoupled from and aligned to.
- [`./0003-path-alias-scheme.md`](./0003-path-alias-scheme.md) — the path-alias scheme and shared/server split that the project scopes here build on.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module-vs-helper boundary the app/test file scoping reflects.
- [`./0012-lint-stance.md`](./0012-lint-stance.md) — the assertion ban and type-aware lint stack (no-unsafe family, explicit-module-boundary-types, consistent-type-imports) that reinforce these compiler guarantees at call sites.
- [`./0005-test-runner-worker-model.md`](./0005-test-runner-worker-model.md) — the test runner whose composite test project consumes this stance's project-reference split and declaration-only outputs.
- [`../../.claude/rules/code-comments.md`](../../.claude/rules/code-comments.md) — the stance that well-typed code carries the WHAT, which this strictness underwrites.
- [`./README.md`](./README.md) — ADR template, status, and lifecycle conventions.
