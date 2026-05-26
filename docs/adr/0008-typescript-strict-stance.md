# 0008. TypeScript strict-plus stance

- **Status:** Proposed
- **Date:** 2026-05-26

## Context

TypeScript's `compilerOptions` surface includes several layers of strictness. The `strict: true` umbrella enables a documented set of related checks (no implicit `any`, strict null checks, strict function types, strict bind/call/apply, strict property initialisation, no implicit `this`, the `alwaysStrict` ES-strict-mode emit). Beyond that umbrella, TypeScript exposes a number of **opt-in** checks that are not part of `strict` but tighten the type system further along orthogonal axes — narrowing index access, demanding explicit override markers, forbidding fallthrough in switch statements, narrowing optional-property semantics, restricting side-effect imports, and gating syntax that the modern type-stripping toolchains can erase versus syntax that requires emit.

The cost of each opt-in is real: the codebase has to satisfy a tighter contract, and a refactor in a poorly-typed area of an existing codebase can produce a wave of compiler errors that have to be resolved before the change can land. The benefit of each opt-in is also real: each one closes a class of "valid TypeScript that the runtime treats differently from how the author expected" that an ESLint rule, a code reviewer, or a runtime check would otherwise have to catch.

This project is a greenfield codebase with no legacy burden. The opt-ins are cheapest to adopt before the codebase grows; retrofitting them later forces the same fixes as adopting them now, at a higher unit cost. The decision below picks a strict-**plus** stance — `strict: true` as the floor, plus a deliberate set of opt-ins that each narrow a different axis — and records the alternatives that were weighed against it.

## Decision

The project compiles under `strict: true` **plus** the following opt-ins, all set in the root TypeScript configuration that every other tsconfig extends:

- `verbatimModuleSyntax`
- `erasableSyntaxOnly`
- `exactOptionalPropertyTypes`
- `noUncheckedIndexedAccess`
- `noImplicitOverride`
- `noFallthroughCasesInSwitch`
- `noUncheckedSideEffectImports`
- `isolatedModules`

Each opt-in narrows a different axis of what the codebase accepts. Together they are treated as a single stance: dropping any one of them is an ADR-level change.

## Alternatives considered

### `strict: true` alone

The umbrella flag with no additional opt-ins. Rejected because each of the opt-ins above closes a class of runtime/intent mismatch that `strict: true` does not catch — for example, an index access that returns `T` when it should return `T | undefined`, an override that compiles silently when the base method is renamed, an optional property accepting an explicit `undefined` value that the contract did not intend to allow. The umbrella is the floor; the opt-ins are the load-bearing additions.

### Full strict family **without** the targeted opt-ins (use ESLint rules instead)

Stay on `strict: true` and lean on ESLint rules (`@typescript-eslint/strict-boolean-expressions`, `no-fallthrough`, `consistent-type-imports`, etc.) for the narrower checks. Rejected because compile-time enforcement and lint-time enforcement are not equivalent: a compiler error blocks the build and the editor, a lint error can be auto-fixed in ways that hide intent, and a project that runs `tsc` in CI cannot rely on lint to enforce a type-system invariant the compiler is willing to accept. ESLint rules complement the compiler stance; they do not replace it.

### No strict family at all — prefer ESLint rules as the baseline

The most permissive position: leave `strict: false` and reach for ESLint rules and code review to catch what `strict` would. Rejected outright as the wrong baseline for a TypeScript codebase — `strict: true` is the modern default, the surface area of "non-strict TypeScript" bugs is well-documented, and there is no playground-vs-production trade-off here (the strict surface costs nothing once the codebase has grown up under it).

### `strict: true` plus only the syntax-and-emit opt-ins (`verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedModules`)

Adopt only the opt-ins that align with the type-stripping toolchain and leave the type-narrowing opt-ins (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`) at their defaults. Rejected because the type-narrowing opt-ins are the ones that catch the highest-value class of "valid TypeScript that surprises at runtime" — index-access nullability in particular is the difference between `Array<T>[number]` returning `T | undefined` (the runtime truth) and `T` (what the unguarded type would suggest).

### `strict: true` plus only the type-narrowing opt-ins (no syntax-and-emit opt-ins)

The mirror image of the above — keep `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, drop `verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedModules`. Rejected because the project's toolchain assumes a single-file transpiler model (Vite, the test runner, and the `vite-node` dev runner all transpile per-file) — `isolatedModules` enforces the constraints that model needs, and `erasableSyntaxOnly` aligns with the modern type-stripping path. Dropping the syntax-and-emit opt-ins would silently allow file shapes the toolchain cannot run.

## Consequences

- **Imports declare type-versus-value intent explicitly.** `verbatimModuleSyntax` requires `import type` for type-only imports; the modern transpiler model can erase those imports cleanly without scanning the module body. A loose `import` of something used only as a type is a compile-time error.
- **Only erasable syntax is permitted.** `erasableSyntaxOnly` forbids the TypeScript-only syntax forms (parameter properties, enum-with-runtime-value, `namespace` with executable members) that a pure type-stripping pass cannot remove. The project compiles under whichever transpiler is convenient — `tsc`, Vite's plugin, Node's native stripper — without portability surprises.
- **Optional properties stop accepting `undefined` by accident.** `exactOptionalPropertyTypes` separates "the property may be absent" (`{ x?: T }`) from "the property may be `undefined`" (`{ x: T | undefined }`). An assignment of `undefined` to a missing-optional property is now a compile error.
- **Index access returns `T | undefined`.** `noUncheckedIndexedAccess` reflects the runtime truth that an arbitrary index may not be populated. Code that previously read an array or record without guarding now requires an explicit check or a non-null assertion at the boundary the author chose.
- **Method overrides are explicit.** `noImplicitOverride` requires the `override` keyword on any method that overrides a base-class method; a base-class rename that the subclass forgets to follow is a compile error rather than a silently broken override.
- **Switch fallthrough is opt-in.** `noFallthroughCasesInSwitch` makes every fall-through case a compile error; intended fall-through has to be expressed explicitly.
- **Side-effect imports are checked.** `noUncheckedSideEffectImports` forbids bare side-effect imports of modules the project cannot resolve, closing a class of "ambient side-effect that loaded in dev but not in prod" mismatch.
- **The codebase is single-file-transpiler safe.** `isolatedModules` ensures every file can be transpiled in isolation, which the toolchain (Vite, the test runner, the dev runner) already requires.
- **Adding a new file or refactoring an existing one happens under the strict-plus contract.** New code is written to satisfy the opt-ins by default; the cost of the stance is paid at write time, not at adoption time.
- **Dropping any opt-in is an ADR-level change.** The combination is the stance; per-opt-in exceptions are not granted at PR level. A repository-wide reason to relax one of the flags is the trigger for a new ADR that records what changed and why.
- **Per-line escape hatches are permitted at intentional boundaries.** A narrow `as` assertion or a `@ts-expect-error` comment at a boundary the author chose (an external-data ingestion point, a known-narrower runtime invariant the type system cannot express) is an acceptable local cost of the stance — it keeps the strict-plus posture for the rest of the file. The same hatch used to silence a check inside otherwise-strict code (rather than at a boundary) is a finding, and a pattern of such hatches across the codebase is the trigger for revisiting the opt-in that prompted them.

## Related

- [ADR-0001](./0001-vite-multi-target-config.md) — the multi-target build that runs under this TypeScript stance.
- [ADR-0004](./0004-path-alias-scheme.md) — the alias resolution declared in the TypeScript paths block, which is the same root config this stance is set in.
- [`../code-reviews/plans/configuration.plan.md`](../code-reviews/plans/configuration.plan.md) — review criteria for changes to the TypeScript configuration surface.
