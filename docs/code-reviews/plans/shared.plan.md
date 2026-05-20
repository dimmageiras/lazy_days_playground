# Code Review Plan: Shared Utilities

## Scope

Cross-cutting **constants, helpers, and shared types** consumed by multiple modules. The defining property: nothing here knows about Fastify, the bootstrap module, or any specific business domain. If it can't be reused by a hypothetical second module in this codebase, it doesn't belong in `shared`.

Three sub-areas:

- **Constants**: protocol/network primitives (HTTP status codes, methods, protocols, host literals), timing primitives (named durations)
- **Helpers**: small, pure utility functions (e.g. promise-based delay)
- **Types**: cross-cutting type declarations (branded primitives, utility types) that don't belong to any single module

## Files currently in scope

These globs are operational hints for where the in-scope content currently lives — the conceptual scope above is canonical and survives a reorganisation.

- `app/shared/constants/**` (HTTP primitives, timing constants, host literals)
- `app/shared/helpers/**` (timing helper and any future cross-cutting helpers)
- `app/shared/types/**` (utility types used across helpers and consumers)

## Required skills

| Skill                     | Why                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                                               |
| `typescript-magician`     | `as const` literal types, `Object.freeze` for runtime immutability, careful exports for both value and type usage |

## Review focus

### Immutability

- Every constants object uses `Object.freeze({...} as const)` — runtime freeze + literal-type narrowing
- No mutation paths exist (the freeze is real; no helper hands out a writable reference)
- `as const` is on the object literal, not on the freeze wrapper, so TypeScript narrows the value types to literals
- The runtime freeze and the type-level narrowing serve different audiences and are both intentional even when one looks redundant against the other. `as const` guards TypeScript-aware callers at compile time; `Object.freeze` guards everyone else at runtime (JavaScript consumers, dynamically reached code paths, debugger-injected mutations). Pairing them is the project's standing convention — do not flag `Object.freeze({...} as const)` as redundant in review.

### Naming

- Constant group names are concept-led: what protocol/concept they describe, not where they're consumed (e.g. `HTTP_STATUS` not `ROUTE_STATUS`)
- Keys within a group use `SCREAMING_SNAKE_CASE` consistently
- Timing constants use a namespace named for the target unit, with keys named only for the amount. The unit lives on the namespace; keys don't repeat it.
- Ambiguous names (e.g. `TENTH` could be ordinal or fractional) are disambiguated explicitly (`ONE_TENTH`)

### Cohesion

- Each constants file holds **one conceptual group**, or several closely-related groups exported from a single file when the boundary is fuzzy
- If a file outgrows its name (a constants file ends up holding values from multiple unrelated concepts), rename or split — don't accumulate
- A constant that ends up consumed by exactly one module belongs in that module's own `constants/`, not in `shared`

### Exports and consumption

- Every value is exported by name (no default exports for constants)
- Consumers destructure at module scope: `const { SECONDS_TWO } = TIMING_IN_MS;` — not deep accessor chains at use sites
- Tree-shaking-friendly: no side effects in the constants files (no `console.log`, no top-level mutation)

### Helper hygiene (pure utility functions)

- Helpers are pure (no I/O, no shared mutable state)
- Each helper is small enough to fit on one screen; if it grows, it probably belongs in a module-specific helper instead of `shared`
- Helpers compose well with other helpers — they don't pull in module-specific dependencies (no Fastify imports, no bootstrap imports)
- Helpers exported via a namespace object (`<Concept>Helper = { fn1, fn2 }`) match the project's convention; the namespace name is the PascalCase form of the kebab-case file name (`<concept>.helper.ts` → `<Concept>Helper`)

### Timing primitives

- The project's timing primitives are built on the date helper backed by `dayjs`. All elapsed-time and deadline arithmetic flows through that helper so the dependency stays in one place.
- Wall-clock semantics are deliberate: `performance.now()` is **not** used for application timing. Reviewers should not propose switching to monotonic clocks. If a future requirement makes monotonic timing necessary, raise it as a shared-helper change rather than swapping the call inline.

### TypeScript discipline

- `as const` narrows values to literals so consumers get autocomplete on the exact strings/numbers
- Type-only consumers use `import type` (e.g. when only the _type_ of a constant group is needed, not the value)
- No `any`; helpers have explicit return types

### When a constant is _not_ truly constant

- A value that varies per environment (port, secret, host) does **not** belong in `shared` — it belongs in the server's config layer where it can flow through options
- The test: would you change this value in `.env.staging`? If yes, it's config, not a shared constant
- The opposite check: is this value defined by an external spec or platform (HTTP status codes, protocol names, IPv6 loopback)? If yes, shared constant.

### Codebase-agnostic naming

- The shared file names should describe what they group, not which module uses them today
- A file called `bootstrap.constant.ts` does not belong in `shared/`; it belongs next to the bootstrap module

## When to run this plan

A PR that:

- Adds a new constants file under `app/shared/constants/**`
- Adds or modifies a helper under `app/shared/helpers/**`
- Promotes a module-local constant into `shared` (especially scrutinise: would two modules actually consume this?)
- Renames a shared constants file (likely a sign the file's concept has drifted)

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
