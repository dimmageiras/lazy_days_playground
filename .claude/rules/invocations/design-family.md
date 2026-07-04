# Invoke `grill-with-docs`, `grilling`, and `domain-modeling`

These three skills are the pre-implementation design family. `grill-with-docs` is the composed workflow — it runs a `/grilling` session **and** keeps the domain model current via `/domain-modeling`. Wire them so the right one fires; when in doubt, `grill-with-docs` covers both atoms.

## `grill-with-docs` — pitch a plan that needs pressure-testing **and** doc-sync

Invoke when the user is forming or pitching a plan that needs pressure-testing against the project's existing domain model and documented decisions, **before** implementation begins. It runs the grilling interview and keeps `CONTEXT.md` / `docs/adr/` in sync as decisions crystallise (lazily — only when there's something to write).

Triggers:

- User pitches a plan: "I'm thinking about…", "what if we…", "I want to add a feature that…", "we should change X".
- Onboarding a feature into an existing bounded context — sharpens scope vs neighbouring contexts.

## `grilling` — pressure-test a plan (interview only)

Invoke when the user wants to stress-test a plan or design before building, or uses a "grill" trigger phrase ("grill me on this", "poke holes in this", "stress-test this plan"), and keeping docs in sync is **not** the point. Pure Socratic interview: walk the design tree one decision at a time, waiting for feedback on each before continuing.

## `domain-modeling` — build or sharpen the domain model (standalone)

Invoke when the user is working the domain model itself, outside a full grilling session. It owns the `CONTEXT.md` glossary and the `docs/adr/` shape; `grill-with-docs` delegates its doc-sync here.

Triggers:

- A new term enters the conversation that may conflict with `CONTEXT.md`, or a fuzzy / overloaded term (`cancellation`, `user`, `order`, …) needs a precise canonical name.
- A decision worth recording is emerging (architecture, public API, data model, bounded-context boundary) — capture it as an ADR inline, not after the fact.
- A refactor or rename touches a domain concept — verify the new name fits the existing vocabulary.

## Boundaries with other skills

- **Bug fixing** → `diagnosing-bugs`, not these.
- **Pure code refactors with no domain shift** → `improve-codebase-architecture`.
- **Authoring docs where the decisions are already settled** → `doc-editing` rule (`doc-coauthoring` + `documentation-and-adrs`).

`grill-with-docs` and `improve-codebase-architecture` may fire together: grill clarifies the term and the decision, improve-codebase reshapes the module accordingly.
