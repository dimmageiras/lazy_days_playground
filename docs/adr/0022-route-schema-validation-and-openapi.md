# 0022. Route schema validation and OpenAPI documentation: one schema validates traffic and describes it, docs served dev-only

- **Status:** Accepted
- **Date:** 2026-07-07

## Context

The server's routes accept and return structured payloads, and two artifacts describe every one of those shapes: a runtime validator that rejects malformed input and constrains the response, and an API description that tells a consumer what the route expects and returns. Kept as two hand-maintained things, they drift — a field added to one side and forgotten on the other, and neither the reader nor the compiler notices. Four forces shape where the shape lives.

- The project already reaches its schema library through a single wrapper seam, where library-wide configuration is pinned once so every schema inherits it. Route shapes must be authored through that same seam; a second schema dialect for routes would split the validation vocabulary and double what a contributor has to learn.
- The framework validates and serialises through a compiler pair that, by default, expects a different schema format than the project's schema library emits. Binding the project's schemas to those compilers needs an adapter seam — without it, the framework cannot consume a project schema at all.
- The generated API description and its interactive explorer are a development affordance. Serving a schema explorer and the full surface description from a deployed process widens the attack surface and ships a UI the deployed system has no reason to serve.
- Runtime validation is a correctness and security boundary, not a convenience. Whatever gates the human-facing docs must not also gate validation, or malformed input would reach handlers in exactly the environment where it matters most.

## Decision

**A route's request and response shapes are declared once as schemas authored through the existing validation wrapper; a dedicated module binds those schemas to the framework's validator and serialiser compilers so the same schema validates traffic at runtime and generates the route's slice of the OpenAPI document; and the interactive documentation surface is registered only when the runtime is development.** The stance has four facets.

- **One schema, two jobs.** A route's shape is a schema authored through the project's validation wrapper and co-located with the route. That single schema is both the runtime validator — the request is rejected before the handler runs, and the response is serialised against it — and the source of the route's OpenAPI fragment. There is no second, hand-maintained description that can fall out of step with the code.
- **A module owns the binding.** Installing the schema-to-compiler adapter, registering the schema-transform plugin, and standing up the document and its explorer is a self-contained runtime capability, so it is a module with a curated surface: one entry installs validation on the instance, another installs the docs. The composition root wires it like any other module, and a route opts in by declaring a schema — there is no per-route bespoke wiring.
- **The docs are a development-only surface; validation is unconditional.** The generated document and its interactive explorer are registered only when the runtime is development; a non-development instance never mounts those routes, so the description and the UI are absent from a deployed process. Request and response validation, by contrast, is installed in every environment — it is a guarantee, not a dev affordance.
- **The docs live under their own namespace.** The documentation surface sits under a dedicated path segment beside the health and internal namespaces, following the namespace-per-concern precedent, so the docs are addressable and separable from product and control-plane traffic.

## Alternatives considered

- **Hand-write the API description alongside separate runtime validators.** Rejected: two descriptions of one shape kept in sync by discipline; they drift the moment a field changes on one side only, and nothing flags the divergence.
- **Adopt a schema library whose types are the framework's native validation format, so the compilers consume them with no adapter.** Rejected: the project already standardised its validation vocabulary on the wrapper seam; a second schema dialect for routes fractures that vocabulary and doubles the surface a contributor must learn, to save one adapter.
- **Validate with the project's schemas but generate no documentation.** Rejected: the shapes are already fully described by the schemas, so emitting the document is free and always accurate; not emitting it throws that away and forces a consumer to read handlers to learn the contract.
- **Serve the documentation surface in every environment.** Rejected: the explorer and full description are a development affordance; a deployed process gains nothing from serving them and pays an attack-surface and payload cost. Gating on the runtime keeps them where they are useful.
- **Gate runtime validation on development too, for symmetry with the docs.** Rejected: validation is a correctness and security boundary; disabling it outside development would let malformed input reach handlers in the environment that matters most. Only the human-facing docs are gated.

## Consequences

**Positive**

- A route's contract is written once; the runtime validator and the published description cannot disagree, because they are the same schema.
- Route schemas inherit the wrapper seam's library-wide configuration for free — no route reaches the raw library, so the single validation vocabulary holds at the route tier too.
- A deployed process serves no documentation surface; the explorer and description exist only where a developer needs them.
- A new route earns both validation and documentation by declaring a schema — the capability generalises without per-route wiring.

**Negative (accepted)**

- The binding depends on a third-party adapter that couples the schema library to the framework's compiler contract; a major version of the adapter, the framework's compiler API, or the schema library is a coordinated break point.
- The generated document is exercised only in development, so a schema change that produces an invalid document could reach a deployed build unnoticed unless something checks the document outside dev. Runtime validation, being unconditional, is still exercised everywhere.
- A deployed instance has no self-describing endpoint; a consumer of a deployed process must obtain the description out of band.
- Three dependencies — the adapter, the document generator, and the explorer UI — join the tree under the exact-pin, release-age stance, and carry its revisit cost.

## Related

- [`./0004-pnpm-dependency-stance.md`](./0004-pnpm-dependency-stance.md) — the exact-pin and release-age treatment the new dependencies inherit.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — the validation wrapper route schemas are authored through; this ADR extends its use from environment and shared schemas to route shapes.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module shape and curated-surface discipline the schema-binding capability follows.
- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the sibling value-validation surface that gates startup on the environment; this ADR is its runtime-traffic counterpart.
- [`./0018-internal-control-plane-namespace.md`](./0018-internal-control-plane-namespace.md) — the namespace-per-concern precedent the documentation namespace follows.
- [`../code-reviews/plans/validation.plan.md`](../code-reviews/plans/validation.plan.md) — the review plan whose route-schema sub-area enforces this decision.
