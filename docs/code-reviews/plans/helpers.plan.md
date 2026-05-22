# Code Review Plan: Shared Helpers

## Scope

Pure, cross-cutting utility functions consumed by multiple modules. The defining property: no I/O, no shared mutable state, no module-specific dependencies — every function is a deterministic transform from its inputs to its return value.

This plan is a depth-focused complement to [`./shared.plan.md`](./shared.plan.md). The shared plan owns the broader rules for constants, helpers, and shared types; this plan sharpens the criteria for the helpers sub-area when it is the focus of the change.

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement.

- `app/shared/helpers/**/*.helper.ts`
- `app/shared/helpers/**/*.helper.spec.ts`

## Required skills

| Skill                     | Why                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                             |
| `typescript-magician`     | Generic return-type narrowing, `as const` discipline, exhaustive overload checking              |
| `vitest`                  | Each helper ships a matching spec; the spec is reviewed under the testing conventions in tandem |

## Review focus

### Namespace pattern

- Each helper file exports a single frozen namespace (`<Concept>Helper`) whose entries are the helper functions.
- The namespace name is the PascalCase form of the kebab-case file name (`<concept>.helper.ts` → `<Concept>Helper`).
- No default exports; no loose function exports alongside the namespace.

### Purity

- No I/O — no `fetch`, no `fs`, no timers (other than the explicit timing helpers), no environment reads.
- No shared mutable state at module scope. A helper that needs scratch storage uses a closure inside the function body, not a module-level cache.
- No side effects on its inputs by default. If a helper logically mutates a structure, it returns a new one. The exception: helpers whose contract is in-place mutation flag it in the name with an `<verb>InPlace` suffix (e.g. `stripKeysInPlace`) — the name carries the side effect into the call site so the caller cannot miss it.

### Size and cohesion

- Each helper fits on one screen. A larger helper is a signal that it belongs in a module-specific helper, not in `shared`, or that it should be decomposed.
- A helper that takes a module-specific dependency (a server-framework-specific type, a route or handler reference, a module bootstrap config) does not belong in `shared` at all — relocate it.

### Spec coverage expectations

- Each helper ships a matching `*.helper.spec.ts` next to it.
- Specs follow the project testing conventions (worker model, `TEST_DATA` shape, context-local `expect`, assertion style) — see [`./testing.plan.md`](./testing.plan.md) for the full criteria; flag deviations here too.
- Pure helpers get table-driven specs by default — one row per case, with the case name describing the expected behaviour.
- Edge cases the spec must cover: empty inputs, boundary values, the "no change" case (input passes through), and the typed-error case if the helper has one.

### Error-message conventions

- A helper that throws uses a typed error (a project-specific error class or a tagged plain error), never a bare `throw new Error("…")` when the caller might branch on the kind.
- Error messages are sentences — capitalised, no trailing period, present tense. They describe the violated precondition, not the call site.

### TypeScript discipline

- Explicit return types on every exported function. Inference is fine inside the namespace body; the public surface declares its shape.
- Generics narrow inputs and outputs together — a generic with no relationship to the return type is usually a sign the function should take a concrete type instead.
- No `any`. `unknown` is acceptable at the boundary; cast it inside the helper after a guard.

### Codebase-agnostic naming

- Function names describe what the helper does to its input, not where it is called from. `escapeHtml(value)` is good; `escapeUserInput(value)` ties the helper to a single call site.
- File names match the namespace — they describe the concept (`html`, `date`, `timing`), not a consumer.

## When to run this plan

A PR that:

- Adds a new helper file under the shared-helpers folder.
- Materially changes the shape, signature, or contract of an existing helper.
- Adds a spec for a helper that was previously untested.
- Splits a helper module into smaller ones, or merges modules.

For PRs touching multiple shared sub-areas (helpers plus constants plus types), run [`./shared.plan.md`](./shared.plan.md) instead — that plan covers the breadth and this one only the depth.

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
