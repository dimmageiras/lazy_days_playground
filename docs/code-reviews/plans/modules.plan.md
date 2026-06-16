# Code Review Plan: Modules

## Scope

The **module tier** — the units under the server modules tree, each an encapsulated runtime capability. This plan reviews the **structural and encapsulation properties common to every module**, independent of what any one module does. The defining property: the **encapsulation boundary**. A module owns a capability and the internals that capability needs — constants, helpers, types, and any routes — and exposes only a curated public surface to the composition layer that wires modules together. What a given module _does_ — its domain correctness — is delegated to that module's own plan.

The canonical definition of a module, and the line that separates it from a helper, live in the **Module** term in [`CONTEXT.md`](../../../CONTEXT.md) and in [ADR-0008](../../adr/0008-module-and-helper-organization.md). This plan checks adherence to that boundary. Concerns include:

- The public surface — what a module exports through its barrel, and whether consumers depend only on that surface
- Internal layout — the per-module subfolders (constants, helpers, types, routes) and their barrels, and the aggregator that composes internals into the capability
- Helpers inside a module following the helper namespace pattern
- Cohesion — one module is one capability; it is neither a grab-bag of unrelated capabilities nor a helper misfiled under the module tree
- Cross-module dependency hygiene — a module reaches another only through its public surface, never into its internals
- Capability-named, rename-test-safe naming

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement.

- `app/server/modules/**` (every module: its `*.module.ts` aggregator, its `index.ts` public barrel, and its `constants/` `helpers/` `types/` `routes/` subfolders with their own barrels)

## Required skills

| Skill                           | Why                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `code-review-and-quality`       | Multi-axis baseline                                                                                |
| `improve-codebase-architecture` | Module boundaries, encapsulation depth, the helper-vs-module call, cross-module coupling, cohesion |

Invoke conditionally, by what the module under review contains:

- `fastify-best-practices` — a module that registers routes or plugins
- `node` — a module that touches process, filesystem, or other runtime concerns
- `typescript-magician` — a module whose public surface or internal types lean on non-trivial generics

The **domain** of a specific module (what its capability must do and how it must behave) is **delegated to that module's own plan** — e.g. the logger module's behaviour belongs to [`./logging.plan.md`](./logging.plan.md), not here.

## Review focus

### Encapsulation boundary and public surface

- A module exposes a curated surface through its barrel; its internals are not re-exported wholesale.
- Consumers — the composition layer and any other caller — depend only on that surface, never on a module's internal files.
- When the composition layer needs an internal detail, the module exposes a curated value for it (for example, a derived list) rather than leaking the internal, so the composition layer stays unaware of how the module works.

### Internal layout

- Internals are grouped by kind in the module's subfolders (constants, helpers, types, and any routes), each with a barrel where the tier uses one.
- The aggregator composes the module's own helpers, constants, and types into the capability; it does not inline logic that belongs in an internal helper.
- The public barrel re-exports the surface, not every internal symbol — a barrel that re-exports internals erases the boundary.

### Helpers within a module

- Helpers inside a module follow the helper namespace pattern ([ADR-0008](../../adr/0008-module-and-helper-organization.md)): one frozen namespace per file, named for the concept, no loose or default exports.
- A module-internal helper that the test runner loads also honours the stateless-dispatcher contract (delegated to the testing and helpers plans for the spec-side detail).

### Cohesion — one capability per module

- A module is exactly one capability. Two unrelated capabilities sharing one module folder is a finding — split them.
- A unit with nothing to encapsulate — a flat namespace of stateless utilities, no curated surface, no internals to hide — is a **helper**, not a module. Filing such a unit under the module tree is a finding; ADR-0010's encapsulation test ("is there a capability with internals worth hiding behind a curated surface?") is the tie-breaker.

### Cross-module dependencies

- A module imports another module through its public barrel only. Reaching into a sibling module's `constants/`, `helpers/`, or `types/` directly is a boundary violation.
- No import cycles between modules. A concern two modules both need belongs in the shared tree (or its own module), not reached sideways from one into the other.

### Naming

- A module and its internals are named for the capability, not for a consumer or a current caller. The rename test (see [`CONTEXT.md`](../../../CONTEXT.md#rename-test)) applies.

## Delegations

- **A module's domain correctness** → that module's own plan (e.g. [`./logging.plan.md`](./logging.plan.md)). This plan covers structure and encapsulation; the domain plan covers behaviour. A PR touching a module runs both.
- **Route/plugin lifecycle** for a module that owns routes → the `fastify-best-practices` criteria and, by analogy, the route-organisation focus in [`./server.plan.md`](./server.plan.md).
- **Spec-author conventions** for a module's internals → [`./testing.plan.md`](./testing.plan.md); the helper-namespace detail → [`./helpers.plan.md`](./helpers.plan.md).

Surface cross-area observations under the finding's Out of scope section; a PR spanning areas runs each plan.

## When to run this plan

A PR that:

- Adds a new module, or adds, removes, or relocates files within an existing module
- Changes a module's public surface (its barrel exports) or its internal subfolder layout
- Moves code between the module tier and the helper or shared trees (the helper-vs-module call)
- Introduces or changes a dependency from one module on another

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).

## Related

- [`../../adr/0008-module-and-helper-organization.md`](../../adr/0008-module-and-helper-organization.md) — the module-vs-helper boundary this plan enforces and the helper namespace shape modules contain
- [`../../../CONTEXT.md`](../../../CONTEXT.md) — the **Module** term
- [`./logging.plan.md`](./logging.plan.md), [`./server.plan.md`](./server.plan.md), [`./helpers.plan.md`](./helpers.plan.md), [`./testing.plan.md`](./testing.plan.md) — sister plans this one delegates to
