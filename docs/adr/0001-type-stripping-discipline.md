# ADR-0001: Lock TypeScript surface to type-stripping-compatible syntax

## Status

Accepted

## Date

2026-05-18

## Context

The TypeScript source for this project runs directly through `vite-node` in dev and is intended to remain runnable by Node's native type-stripping (`node --experimental-strip-types`, stable on the LTS line the project targets) without a separate compile-and-emit step. Type stripping is a syntactic transform: the loader removes type-only syntax tokens and runs the resulting JavaScript. Anything the loader can't simply erase — `enum`, `namespace`, parameter properties (`constructor(private name: string)`), or value-position type imports — is a parse error at runtime, even though `tsc` accepts them.

The TypeScript compiler exposes two flags that, together, statically reject the syntax shapes type stripping cannot handle:

- `erasableSyntaxOnly` flags `enum`, `namespace` (value form), parameter properties, and other non-erasable constructs.
- `verbatimModuleSyntax` forbids implicit elision of `import` / `export` of type-only references, requiring explicit `import type` / `export type` so the stripper does not have to infer which imports are type-only.

A complementary flag, `noUncheckedSideEffectImports`, refuses to resolve bare `import "..."` lines that don't appear in the project's import graph as a value or type — this catches side-effect imports that would silently be dropped by the stripper.

Without these flags, the codebase is one PR away from drifting into shapes that `tsc` happily compiles but the runtime loader rejects, with no signal from CI until the dev server fails to start.

## Decision

Keep `erasableSyntaxOnly`, `verbatimModuleSyntax`, and `noUncheckedSideEffectImports` permanently enabled at the root `tsconfig.json`, inherited by every project reference.

A PR that disables, narrows, or carves out exceptions from any of these flags must justify the change in its description and link this ADR.

## Alternatives Considered

### Use a build step (esbuild / tsc / swc) and drop the runtime constraint

- Pros: Lifts the syntax limit; full TypeScript feature set available; faster startup (precompiled).
- Cons: Adds a build pipeline to maintain; introduces a source-vs-build divergence (debug-time line numbers, source maps, watch loops); contradicts the project's "TypeScript runs directly in dev" property.
- Rejected: The build-step cost is high for a single-package server that benefits from the dev-loop simplicity of native type stripping.

### Adopt ts-node / tsx / @swc-node as the runtime loader

- Pros: Same dev-loop simplicity as type stripping; full TypeScript syntax accepted at runtime.
- Cons: Introduces a third-party transformer in the hot path; pins the project to its release cadence and bug surface; defeats the "no extra transformer needed" benefit Node 24+ explicitly offers.
- Rejected: Native type stripping is the simpler runtime contract and has the platform's maintenance backing.

### Leave the flags off and rely on review/CI

- Pros: Less friction for contributors who reach for `enum` out of habit.
- Cons: Drift is silent until a runtime failure; reviewers and agents would have to memorise the type-stripping forbidden list; the failure mode (parse error at module load) is far enough from the source change that bisecting it is wasteful.
- Rejected: The compiler check is the cheapest, earliest signal; turning it off only saves a few keystrokes per PR while losing a reliable guard.

## Consequences

- The codebase cannot use `enum` (use `as const` object literals + union types instead), `namespace` value form (use plain object literals or modules), parameter properties (declare and assign in the constructor body), or value-position type imports (always `import type` for type-only references).
- A new contributor surprised by an `erasableSyntaxOnly` error should be linked to this ADR rather than have the flag relaxed.
- If Node retires native type stripping (unlikely on the project's targeted LTS line), this ADR is superseded by a new ADR choosing an alternative runtime loader; the flags are relaxed there.
- The discipline is enforced at typecheck time only — runtime breakage would happen if `tsc` were skipped in CI. Keep typecheck in the required-checks set.
