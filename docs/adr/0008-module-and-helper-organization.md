# 0008. Module vs helper boundary and the helper namespace pattern

- **Status:** Accepted
- **Date:** 2026-06-16

## Context

The codebase accumulates two kinds of code that are easy to conflate. Some code is a self-contained runtime capability — it owns state, configuration, types, and possibly routes, and has a how-it-works the rest of the application should not depend on. Other code is a flat bag of stateless utility functions that exists purely to be called; it encapsulates nothing and hides nothing. The glossary already draws this line: a **module** encapsulates one runtime capability and owns the internals that capability needs, exposing only a curated public surface to the composition layer; a **helper** is a flat namespace of stateless utilities. A module may _contain_ helpers, but a helper is never a module.

Two structural questions then repeat at every file and need a single, mechanical answer. First, for a module: what folder shape and entry-point discipline make the promised encapsulation enforced rather than merely intended — there is one reference capability today and no lint rule that forbids reaching past its front door, so without a fixed shape the next capability is free to leak its internals. Second, for a helper: how each file exposes its functions and how consumers reach them — left to per-file taste, helper files drift into three shapes (bare named exports, default-exported objects, a mix), call sites drift in parallel, and a reader cannot tell from `format(...)` which file it came from. The forces are reader navigability, grep-ability, runtime immutability, a structural public/private boundary, and one convention learned once and applied across both the shared and server trees.

## Decision

A unit is a **module** if it owns internals worth hiding, and a **helper** if it is just callable functions. That single test — a module may contain helpers, but a helper is never a module — decides the shape every other facet of this decision follows from.

**Modules** get a curated, encapsulated surface. A module is a folder named for its capability that owns its internals in dedicated sub-areas — its constants, helpers, types, and any routes live _inside_ the module, not in shared trees. The capability's behaviour is assembled into a single namespace object frozen at definition, and access is gated through one **index barrel** that re-exports exactly the curated public surface — the frozen capability namespace and the public types — and nothing else. Everything the barrel does not name is private by construction: internal helpers, constants, and intermediate types are reachable only by sibling files within the module. Consumers depend on **what** a module exposes, never on **how** it is built — they import only from the module root, and reaching into a module's sub-areas from outside is forbidden.

**Helpers** get none of that scaffolding — there is nothing to encapsulate, so no barrel and no public/private split. Every file matching the `*.helper.ts` naming convention exports **exactly one** frozen namespace object, named in PascalCase after the file (an array helper exports `ArrayHelper`, an error helper exports `ErrorHelper`), wrapping all of that file's stateless functions as its properties. It is the file's only export; the bare functions are never exported. `Object.freeze` makes the surface immutable at runtime; an `as const` assertion preserves each member's precise type and marks the namespace `readonly`, so immutability lives in both the runtime object and its type. A generic illustration:

```ts
const doThing = (input: string): string => input.trim();
const doOther = (input: string): boolean => input.length > 0;

const ExampleHelper = Object.freeze({
  doOther,
  doThing,
} as const);

export { ExampleHelper };
```

Consumers import the namespace and **destructure the members they need at the top of the module**, immediately after imports, rather than referencing members inline at every call:

```ts
import { ExampleHelper } from "...";

const { doThing } = ExampleHelper;
```

The two facets meet at the module's own helper: it follows this same per-file frozen-namespace convention, yet stays private behind the barrel — it is an internal collaborator of that module, not a shared utility. The helper convention applies with no exceptions across both trees — the cross-cutting shared helpers and the server-side helpers — and to a helper inside a module exactly as to a top-level one. Both facets are universal and self-reinforcing: a new module copies the one reference shape, and a new helper file is written this way because every existing one is.

This decision owns the module folder shape, the index-barrel discipline, the internal-versus-public boundary, the per-file helper-namespace convention, and the rule connecting them. It does not own the shared/server lane split that decides where shared code lives, nor the behaviour of any specific capability.

## Alternatives considered

- **Flat helper trees with no module concept.** Put every utility — stateful capability or pure function alike — into shared, flat helper namespaces grouped by topic. Rejected: a stateful capability with configuration and a lifecycle has internals that should not be globally reachable. Flattening everything erases the public/private boundary, so any file can wire into any other capability's guts and the "depend on what, not how" contract becomes unenforceable.

- **Module folders without an index barrel.** Keep capability folders but let consumers import directly from whichever file inside holds what they want. Rejected: without a single curated entry point, every file is implicitly public, renaming an internal file becomes a breaking change for outside callers, and there is no honest distinction between public surface and implementation.

- **A public/private split enforced only by naming convention.** Skip the barrel and signal privacy by file-naming (an "internal" marker) while still allowing deep imports. Rejected: a convention with no chokepoint relies on every author and reviewer remembering it. The barrel makes the public surface a single reviewable file and makes a deep import visibly wrong, which a naming convention alone cannot.

- **Bare per-symbol named exports for helpers (the wrapper style).** Export each function directly and let consumers import them individually. Rejected for helpers because it produces no file-level anchor at the call site — a reader sees `doThing(...)` with no indication of origin, and a file's call surface is a scattered set of imports rather than one token. This style is deliberately retained for library wrappers, where the goal is to mirror the wrapped library's own flat export shape, not to brand a namespace.

- **Default-export the namespace object.** Export the helper namespace (or capability namespace) as the file's default. Rejected because default exports invite inconsistent local naming at each import site, defeating the "one stable token per file" goal, and because the project's lint stance bans default exports outside config files.

- **Mutable (non-frozen) namespace.** Group the functions or assemble the capability in a plain object and skip `Object.freeze`. Rejected because an unfrozen surface can be reassigned, monkey-patched, or extended after construction; freezing at definition makes the stateless or curated contract immutable and the behaviour predictable across consumers, removing a class of action-at-a-distance bugs.

- **Per-call namespace access without top-of-module destructuring.** Keep the frozen helper namespace but reference members inline everywhere. Rejected as the default because it repeats the namespace prefix at every call and obscures which members a module actually depends on; destructuring once at the top gives a single dependency manifest per consuming file.

## Consequences

**Positive.**

- A module's public surface is exactly one file (the barrel), readable and reviewable in isolation; the rest of the folder is free to change without breaking consumers. The internal/public boundary is structural, not aspirational — outside code physically cannot name a private collaborator.
- Every helper call site reaches a member through a name that points at the source file, so origin is readable without chasing imports, and one stable unique token per helper file makes the file and its whole surface trivially grep-able.
- Frozen, `as const` surfaces are immutable at runtime and precisely typed, so neither the stateless helper contract nor a module's exposed behaviour can be quietly violated; a capability behaves identically for every consumer.
- The helper-is-not-a-module test gives a crisp, repeatable answer to "module or helper?" at design time, and each shape has exactly one correct form — a new capability has a concrete template to copy, a new helper has one mandated layout, and a reviewer can flag any deviation mechanically. This keeps the tree legible to engineers and agents alike.
- The top-of-module destructuring block doubles as a per-consumer dependency manifest.

**Accepted negative.**

- More ceremony for small units: even a thin capability pays for a barrel, a frozen namespace, and sub-area folders rather than dropping a function into a shared helper, and each helper file carries the frozen-wrapper boilerplate and an extra destructuring line in every consumer that a bare-export style would not.
- The helper convention is all-or-nothing: because it is universal and self-reinforcing, reversing it or carving out an exception means touching every helper file and every call site at once, not one file in isolation.
- The discipline is enforced by review, not tooling — nothing mechanically rejects a deep import past a module's barrel today, so the boundary depends on reviewers holding the line until a lint rule backs it. With one module in existence, the module shape is a template rather than a battle-tested convention; the first few additional modules may surface gaps the single reference case did not.
- The structural sameness between a module's private helper and a shared helper can mislead a reader into treating an internal collaborator as reusable; the barrel is the only signal that it is private.
- Tree-shaking is coarser than with bare named exports — a namespace is a single binding, so a bundler cannot drop individual unused members as readily; acceptable here because helpers are small and the server is not shipped through a production bundle.

## Related

- [`./0003-path-alias-scheme.md`](./0003-path-alias-scheme.md) — the shared/server lane split that decides where code lives before the module-vs-helper question even applies, and whose generic shared-lane helpers this convention populates.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — the wrapper convention, which deliberately uses bare per-symbol named exports rather than a frozen namespace.
- [`./0010-logging-and-error-handling.md`](./0010-logging-and-error-handling.md) — behaviour of the one capability currently built to the module template; this ADR fixes its shape, that ADR fixes what it does.
- [`./0012-lint-stance.md`](./0012-lint-stance.md) — the no-default-exports lint rule that backs named exports and rules out the default-export alternative.
- [`./0002-typescript-compiler-stance.md`](./0002-typescript-compiler-stance.md) — the compiler stance whose app/test file scoping reflects this module-vs-helper boundary.
- [`./0005-test-runner-worker-model.md`](./0005-test-runner-worker-model.md) — the worker-model contract whose stateless-dispatcher rule applies this boundary to shared test helpers.
- [`./0011-single-port-server-lifecycle.md`](./0011-single-port-server-lifecycle.md) — the server lifecycle this boundary situates, reached through its curated surface.
- [`../../CONTEXT.md`](../../CONTEXT.md) — canonical definitions of **Module** and helper that this decision operationalises.
- [`./README.md`](./README.md) — ADR template, status, and lifecycle conventions.
