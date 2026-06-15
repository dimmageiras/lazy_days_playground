# 0003. Path-alias scheme and the shared/server split it enforces

- **Status:** Proposed
- **Date:** 2026-06-14

## Context

Application code divides into two kinds of module: cross-cutting code that is environment-agnostic (validation schemas, library wrappers, generic helpers, shared constants and types) and code that only runs inside the Node/server runtime. Alongside both sits a non-application config surface — build config, test setup, and shared test helpers. Left to deep relative imports, those distinctions are invisible: a server-only module could be pulled into the agnostic tree, or the agnostic tree could reach back into the runtime, and nothing would object until something broke far from the edit.

Relative-path imports (`../../..`) make the boundary impossible to see and impossible to enforce. They also rot under refactors: move a file one level and every relative specifier that pointed at it is silently wrong in spirit even when it still resolves. Three toolchain surfaces resolve or order imports — the type checker, the bundler/dev runtime, and the linter — and each could grow its own private notion of where a module lives, drifting out of sync.

The decision below establishes one alias scheme, names a single place to edit it, and gives the boundary structural teeth so the partition is something a tool can check rather than a convention a reviewer has to remember.

## Decision

Cross-tree references go through a small set of `@`-prefixed path aliases, declared once and consumed everywhere, and a lint rule forbids the deep relative imports that would otherwise bypass them. The decision has four facets.

**One alias per tree, three trees.** The scheme names exactly the cross-tree surfaces it has consumers for today:

- a **shared lane** — cross-cutting, environment-agnostic modules (schemas, wrappers, generic helpers, shared constants and types);
- a **server lane** — the Node/server runtime;
- a **config surface** — the non-application configuration tree (build/runtime config, test setup, and the shared test helpers consumed across specs).

These aliases are the only sanctioned way to reference another tree. There is deliberately **no client lane yet**: an alias with no consumers is dead surface, so a fourth application alias is added only when client code actually exists, not in anticipation of it.

**One-way dependency direction.** The server lane may depend on the shared lane; the shared lane never depends on the server lane. The config surface may depend on the shared lane for test fixtures and helpers. The shared lane stays runtime-agnostic by construction — a reverse edge would make "environment-agnostic" untrue and the partition meaningless.

**One source of truth.** The aliases are declared once, in the root TypeScript compiler's path-mapping block. The other surfaces consume that declaration rather than restating it:

- the **bundler/dev runtime** resolves the aliases by reading the TypeScript path config directly — a single built-in "resolve via tsconfig paths" switch on the shared bundler base, inherited by every per-runtime config, with no parallel hand-maintained alias map to drift;
- the **linter's import-ordering rule** lists the same aliases as ordered groups, so import blocks sort into a predictable shape.

**A depth cap with structural teeth.** A lint rule caps relative-import depth at a single `../`: any specifier that climbs two or more levels is an error whose message points the author at the aliases. Cross-tree references therefore _must_ go through an alias; they cannot be written as deep relative paths. The boundary is enforced at build time, not by reviewer memory.

```ts
// rejected: a deep relative climb out of the current tree
import { thing } from "../../shared/helpers/thing";

// required: the same cross-tree reference through its alias
import { thing } from "@shared/helpers/thing";
```

## Alternatives considered

- **Deep relative imports only, no aliases.** Rejected: the shared/server boundary becomes invisible and unenforceable, and specifiers rot on every move — there is nothing for a tool to check.
- **A flat single-tree layout with no shared/server distinction.** Rejected: it loses the runtime-agnostic guarantee. Without a structural line, environment-specific code leaks into modules meant to run anywhere, and the leak surfaces only at a failure site.
- **Allow bidirectional dependencies between the lanes.** Rejected: if the shared lane may import from the server lane, "environment-agnostic" stops being true and the partition no longer means anything. The one-way rule is the whole point of the split.
- **Add the client lane now, ahead of any client code.** Rejected: an alias with no consumers is dead surface that invites premature placement decisions. The lane is added when client code lands, not before.
- **Restate the alias map in every surface — type checker, bundler, and linter each with its own copy.** Rejected: hand-maintained copies drift. Having the bundler read the compiler path config directly removes one copy entirely; declaring the set once keeps the remaining mirror (the lint ordering groups) trivially auditable against the source of truth.
- **Enforce the boundary by review convention instead of a lint rule.** Rejected: conventions are not checkable and degrade silently. The depth cap turns "go through an alias" into a build-time error.

## Consequences

**Positive**

- The shared/server boundary is visible at every import site and enforced mechanically, not by reviewer memory.
- The alias set has one definition; the bundler reads it directly and the linter mirrors only the ordering groups, so there is at most one place to update and one place to audit.
- Import specifiers survive file moves within a tree — an alias-rooted path does not change when an intermediate directory is renamed, which is exactly the rename-test property the project values.
- Import blocks have a predictable, tool-sorted shape because the ordering groups track the alias set.
- The runtime-agnostic guarantee of the shared lane is structural: a reverse dependency would have to be written, reviewed, and would still trip the depth cap if it tried to climb out as a relative path.

**Accepted negatives**

- Two surfaces must agree by hand: the source-of-truth path block and the linter's ordering groups. The bundler reads the source directly, but the ordering groups are a manual mirror — adding or renaming an alias means editing the groups too, or the sort silently misfiles the new alias.
- The single-`../` depth cap is a blunt instrument: it forbids legitimate two-level relative imports inside one tree along with the cross-tree climbs it targets, so some intra-tree references that would read fine as relative paths must be written as aliases.
- New contributors must learn the alias scheme before their imports pass lint; a deep relative path that resolves fine in their editor is a build error here.
- The scheme assumes alias resolution is uniformly available across the toolchain. A tool that cannot read the path config — or a context where the bundler switch does not apply — needs its own resolver configuration, or alias-rooted imports will fail to resolve there.

## Related

- [`./0001-vite-multi-target-and-dev-runtime.md`](./0001-vite-multi-target-and-dev-runtime.md) — the shared bundler base carrying the "resolve via tsconfig paths" switch, inherited by every per-runtime config and the dev runtime.
- [`./0002-typescript-compiler-stance.md`](./0002-typescript-compiler-stance.md) — the solution-project-references setup whose root config carries the canonical path-mapping block, and the bundler module-resolution mode the aliases rely on.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module-vs-helper and helper-namespace architecture that lives _inside_ each lane; this ADR draws the lane boundary, that one shapes what sits within it.
- [`./0012-lint-stance.md`](./0012-lint-stance.md) — the broader lint stack that hosts the import-ordering and relative-depth rules enforcing this scheme.
- [`./0005-test-runner-worker-model.md`](./0005-test-runner-worker-model.md) — the test runner whose test project mirrors this alias scheme so specs resolve identically under test and at runtime.
- [`./0013-client-state-lanes.md`](./0013-client-state-lanes.md) — the forward-looking client lane this split does not yet carry; that ADR is its client-tier doctrine.
- [`../../CONTEXT.md`](../../CONTEXT.md) — domain glossary, including the **Rename test** the alias scheme is designed to satisfy.
