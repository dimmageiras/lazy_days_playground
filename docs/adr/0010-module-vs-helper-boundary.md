# 0010. Module vs helper boundary

- **Status:** Proposed
- **Date:** 2026-06-04

## Context

The codebase has two tiers of code organisation whose names are easy to confuse. [ADR-0007](./0007-helper-namespace-pattern.md) defines a **helper** precisely — one frozen namespace of stateless functions grouped by concept. But a second tier emerged — units placed under a dedicated modules tree, each owning a folder of internal constants, helpers, types, and sometimes routes, fronted by a single aggregator file and a barrel. Nothing recorded what makes that tier different, so "is this a module or a helper?" had no answer a contributor could look up, and the question recurred the moment a second cohesive area (the application-environment concern: an env schema, its inferred types, validation, and env-to-domain mapping) grew enough pieces to look module-shaped.

Two forces shaped the answer. First, the existing module exemplars — the logger capability and the server-lifecycle bootstrap — each wrap a _runtime capability_ and deliberately hide their internals from the layer that composes them (the bootstrap unit even exports a curated redaction list so the composition layer "doesn't have to know" which internals are sensitive). Second, the application-environment concern's core — its schema and inferred types — intentionally lives in the cross-target shared tree because both build targets consume the env shape; the validation and mapping functions are thin stateless dispatchers.

## Decision

A **module** is a self-contained unit that encapsulates one runtime capability and owns the internals that capability needs — its constants, helpers, types, and any routes — exposing only a curated public surface to the composition layer that wires modules together. A module hides how it works; consumers depend on what it exposes, not on how it is built.

A **helper** remains as [ADR-0007](./0007-helper-namespace-pattern.md) defines it: a flat frozen namespace of stateless functions that encapsulates nothing. A helper is a building block — it lives standalone or _inside_ a module. A module may contain helpers; a helper is never a module.

The criterion is **encapsulation of a capability**, not size or sub-part count. Concretely: a unit that owns a runtime capability with internals worth hiding is a module; a stateless utility namespace is a helper; and a cross-cutting data contract or environment input is neither — it is treated as composition-layer input, kept as helpers plus shared schema/types.

By this rule, the application-environment concern stays helpers plus shared schema/types. It is not promoted to a module.

## Alternatives considered

### Promote the application-environment concern to a module

Bundle its schema, types, validation, and mapping into one module folder. Rejected because its defining contract — the env schema and inferred types — is intentionally shared across build targets and cannot move inside a server-only module without breaking the shared/server split (see [ADR-0001](./0001-vite-multi-target-config.md), [ADR-0004](./0004-path-alias-scheme.md)); a unit whose core contract must live outside it is not really a module. Its functions are also thin stateless dispatchers with nothing to encapsulate, and environment is _input_ to the composition layer, not a capability the layer calls into.

### Collapse the module tier — make everything a helper

Drop the module concept and express every area as helpers. Rejected because real capabilities (producing the application logger; owning the server-lifecycle) own internals — transport configuration, lifecycle helpers, routes — that benefit from being hidden behind a curated surface. Flattening them to loose helpers leaks those internals to the composition layer and loses the one-import-per-capability boundary.

### Define "module" by size or number of sub-parts

Call something a module once it has, say, three or more files or its own subfolders. Rejected because size is a symptom, not the criterion: a small capability is still a module, and a large pile of utilities is still helpers. Drawing the line on encapsulation keeps the classification stable as a unit grows or shrinks.

## Consequences

- New code has a lookup-able test: owns a runtime capability with internals to hide → module; stateless utility namespace → helper; cross-cutting contract or config/env input → helpers plus shared schema/types, treated as composition input.
- A module gets a folder of internal constants, helpers, types, and any routes, fronted by a curated public surface; the composition layer wires modules together without depending on their internals.
- Helpers inside a module still follow [ADR-0007](./0007-helper-namespace-pattern.md); the module tier sits above the helper tier rather than replacing it.
- The application-environment concern stays split across the shared tree (schema, types) and the server helpers (validation, mapping). Accepted cost: its pieces are not co-located — navigable, but spread across more than one place.
- Cross-target data contracts cannot become server-only modules; this reinforces the shared/server boundary rather than eroding it.
- The boundary still needs judgement at the margin — a borderline capability may invite debate. The encapsulation test ("is there a capability with internals worth hiding behind a curated surface?") is the tie-breaker, and this ADR is the reference when it is contested.

## Related

- [ADR-0007](./0007-helper-namespace-pattern.md) — the helper namespace pattern this boundary sits above
- [ADR-0001](./0001-vite-multi-target-config.md), [ADR-0004](./0004-path-alias-scheme.md) — the shared/server split that keeps cross-target contracts out of server modules
- [`../../CONTEXT.md`](../../CONTEXT.md) — the **Module** glossary term this ADR backs
