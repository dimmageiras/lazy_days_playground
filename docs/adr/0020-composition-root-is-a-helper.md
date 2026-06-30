# 0020. The application composition root is a helper

- **Status:** Proposed
- **Date:** 2026-06-26

## Context

[ADR-0008](./0008-module-and-helper-organization.md) sorts every unit of code into one of two shapes: a **module** — a folder that encapsulates a runtime capability and hides its internals behind an index barrel — or a **helper** — a single frozen namespace of stateless, callable functions. Its decisive test is _a unit is a module if it owns internals worth hiding, and a helper if it is just callable functions._

That test leaves one recurring unit unclassified: the **composition root** — the stateless function that assembles the running application by instantiating the server, wiring the modules together, registering the routes, and installing the shutdown lifecycle. The composition root owns no hidden internals — it holds no state and curates no surface — so it is plainly not a module. Yet it is not an obvious leaf utility either, and ADR-0008's own wording repeatedly names "the composition layer" as the _consumer_ of modules, which invites reading it as a third, distinct role.

Left unruled, the composition root drifts. It tends to sit at a tree root as a bare single-symbol export that follows neither the helper-namespace convention nor the wrapper seam — becoming the one file in the tree that obeys no export rule, the precise drift ADR-0008's universal helper convention exists to foreclose.

## Decision

The application composition root is a **helper**. Because it is a stateless callable function that owns no internals worth hiding, it satisfies ADR-0008's helper test directly, and is therefore subject to the same `*.helper.ts` convention as every other helper. It is a single `Object.freeze(… as const)` namespace named in PascalCase after its file (a `composition-root.helper.ts` exports a `CompositionRootHelper`); that namespace is the file's only export — the bare assembly function is never exported directly — and consumers reach it by destructuring at the top of the consuming module.

The composition root is **not** promoted to a module — there is no capability to encapsulate, only other capabilities to wire. It is also **not** granted a separate "composition layer" file category. Where ADR-0008 speaks of "the composition layer," it names a _calling relationship_ — the process entry / bootstrap invoking the assembled application — not a distinct construct the composition function itself must inhabit. That entry / bootstrap remains the top-level seam that calls the composition helper.

## Alternatives considered

- **Leave it at a tree root as a bare single-symbol export.** Its own file exporting the assembly function directly. Rejected: a bare per-symbol export matches neither the helper-namespace convention nor the wrapper seam ([ADR-0007](./0007-library-wrapper-seam.md), the only sanctioned bare-export style), so it remains the lone file escaping ADR-0008's universal rule — the drift the convention is meant to prevent.
- **Promote the composition root to a module.** Give it a capability folder, an index barrel, and sub-areas. Rejected: a module exists to hide internals behind a curated surface; the composition root has none — it only orchestrates other modules — so the module scaffolding would wrap nothing private.
- **Introduce a dedicated "composition layer" file category** with its own naming and export rules. Rejected: a third category for what is structurally a single stateless function adds a convention to learn for no encapsulation, reuse, or grep benefit the helper shape does not already provide. The helper test already classifies it, and the entry/bootstrap already supplies the top-level seam.

## Consequences

**Positive.**

- The composition root obeys the same single convention as every other callable file; no file in the tree is exempt from the helper-namespace rule, and any reader or agent classifies it by the identical ADR-0008 test.
- The drift toward a bare, rule-less root export is closed structurally rather than by reviewer vigilance.

**Accepted negative.**

- "Helper" must be read as _any stateless callable file_, not _small utility_: a reader expecting only leaf utilities may be momentarily surprised to find the application-assembly function among the helpers. The file and namespace name are the disambiguating signal.
- The composition root pays the helper ceremony — a frozen namespace plus a destructuring line — for a function typically called from a single site, where the grep-ability and call-site branding that justify the convention elsewhere are marginal. Accepted for uniformity, consistent with the "more ceremony for small units" trade-off ADR-0008 already records.

## Related

- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module-vs-helper boundary and universal helper-namespace convention this ADR extends; it defines the helper test applied here and names "the composition layer" this ADR situates. ADR-0008's reasoning body stays in force, unedited; the cross-reference is reciprocal — recorded only as a `Related` link on both sides, which the ADR lifecycle treats as distinct from a reasoning-body edit.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — the wrapper convention: the only sanctioned bare per-symbol export style, which the composition root is explicitly **not**.
- [`../../CONTEXT.md`](../../CONTEXT.md) — canonical definitions of **Module** and helper that ADR-0008 operationalises and this ADR leans on.
