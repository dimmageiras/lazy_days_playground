# Code Review Plan: Shared Utilities

## Scope

Cross-cutting **constants and helpers** consumed by multiple modules. The defining property: nothing here knows about Fastify, the bootstrap module, or any specific business domain. If it can't be reused by a hypothetical second module in this codebase, it doesn't belong in `shared`.

Two sub-areas:

- **Constants**: protocol/network primitives (HTTP status codes, methods, protocols, host literals), timing primitives (named durations)
- **Helpers**: small, pure utility functions (e.g. promise-based delay)

## Files currently in scope

- `app/shared/constants/**` (HTTP primitives, timing constants, host literals)
- `app/shared/helpers/**` (timing helper and any future cross-cutting helpers)

## Required skills

| Skill | Why |
| --- | --- |
| `code-review-and-quality` | Multi-axis baseline |
| `typescript-magician` | `as const` literal types, `Object.freeze` for runtime immutability, careful exports for both value and type usage |

## Review focus

### Immutability
- Every constants object uses `Object.freeze({...} as const)` — runtime freeze + literal-type narrowing
- No mutation paths exist (the freeze is real; no helper hands out a writable reference)
- `as const` is on the object literal, not on the freeze wrapper, so TypeScript narrows the value types to literals

### Naming
- Constant group names are concept-led: what protocol/concept they describe, not where they're consumed (e.g. `HTTP_STATUS` not `ROUTE_STATUS`)
- Keys within a group use `SCREAMING_SNAKE_CASE` consistently
- Timing constants follow the project's existing pattern: `<UNIT>_<AMOUNT>_IN_<UNIT>` (e.g. `SECONDS_FIVE_IN_MS`)
- Ambiguous names (e.g. `TENTH` could be ordinal or fractional) are disambiguated explicitly (`ONE_TENTH`)

### Cohesion
- Each constants file holds **one conceptual group**, or several closely-related groups exported from a single file when the boundary is fuzzy
- If a file outgrows its name (e.g. `server.constant.ts` no longer holds server settings), rename or split — don't accumulate
- A constant that ends up consumed by exactly one module belongs in that module's own `constants/`, not in `shared`

### Exports and consumption
- Every value is exported by name (no default exports for constants)
- Consumers destructure at module scope: `const { SECONDS_TWO_IN_MS } = TIMING;` — not deep accessor chains at use sites
- Tree-shaking-friendly: no side effects in the constants files (no `console.log`, no top-level mutation)

### Helper hygiene (pure utility functions)
- Helpers are pure (no I/O, no shared mutable state)
- Each helper is small enough to fit on one screen; if it grows, it probably belongs in a module-specific helper instead of `shared`
- Helpers compose well with other helpers — they don't pull in module-specific dependencies (no Fastify imports, no bootstrap imports)
- Helpers exported via a namespace object (`<Concept>Helper = { fn1, fn2 }`) match the project's convention; the namespace name is the PascalCase form of the kebab-case file name (`<concept>.helper.ts` → `<Concept>Helper`)

### TypeScript discipline
- `as const` narrows values to literals so consumers get autocomplete on the exact strings/numbers
- Type-only consumers use `import type` (e.g. when only the *type* of a constant group is needed, not the value)
- No `any`; helpers have explicit return types

### When a constant is *not* truly constant
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
