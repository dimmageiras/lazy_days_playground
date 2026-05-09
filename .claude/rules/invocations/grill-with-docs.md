# Invoke `grill-with-docs`

Invoke the `grill-with-docs` skill when the user is forming or pitching a plan that needs pressure-testing against the project's existing domain model and documented decisions, **before** implementation begins.

## Triggers

- User pitches a plan: "I'm thinking about…", "what if we…", "I want to add a feature that…", "we should change X".
- A new term enters the conversation that may conflict with `CONTEXT.md`.
- A decision worth recording is emerging (architecture, public API, data model, bounded-context boundary) — the skill captures it as an ADR inline, not after the fact.
- Refactor or rename touches a domain concept — the skill verifies the new name fits the existing vocabulary.
- Onboarding a feature into an existing bounded context — the skill sharpens scope vs neighbouring contexts.
- User uses a fuzzy term (`cancellation`, `user`, `order`, etc.) that already has a precise meaning in `CONTEXT.md`.

The skill keeps `CONTEXT.md` and `docs/adr/` in sync with the conversation as decisions crystallise. Files are created lazily — only when there's something to write.

## Boundaries with other skills

- **Bug fixing** → `diagnose`, not this skill.
- **Pure code refactors with no domain shift** → `improve-codebase-architecture`.
- **Authoring docs where the decisions are already settled** → `doc-editing` rule (`doc-coauthoring` + `documentation-and-adrs`).

`grill-with-docs` and `improve-codebase-architecture` may fire together: grill clarifies the term and the decision, improve-codebase reshapes the module accordingly.
