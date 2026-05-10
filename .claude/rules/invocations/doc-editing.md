# Invoke `doc-coauthoring` + `documentation-and-adrs`

Invoke **both** skills before writing or editing any of:

- `*.md` files anywhere in the repo (including `README.md` files)
- files under `docs/**`
- `CONTEXT.md` (domain glossary)
- files under `docs/adr/**` (ADRs)

`doc-coauthoring` guides the structured authoring workflow (context transfer, iteration, reader verification). `documentation-and-adrs` ensures architectural decisions, public-API changes, and shipped features get recorded as ADRs that future engineers and agents can find.

## Keep the content codebase-agnostic

Documentation and ADRs describe **concepts, decisions, and conventions** — not the current state of specific files. When authoring or editing:

- Do **not** paste literal code snippets from this repo as illustrations. Use minimal, generic examples that show the pattern rather than excerpts from real modules.
- Do **not** reference specific function names, file paths, component names, or variable identifiers from the codebase ("see `getUserById` in `app/api/users.ts`"). These rot the moment the code is renamed or moved.
- Do **not** name commits, branch names, PR numbers, or contributors as part of the doc body.
- **Do** describe the rule, the trade-off, the contract, or the decision in language that survives a refactor — abstract away the current implementation so the doc stays correct after the next rewrite.
- ADRs are the only exception for naming a system/component — they record the _decision_ about that component. Even there, focus on the decision and the alternatives considered, not the current code.

The test: if every file in the repo were renamed and reorganised tomorrow, the doc should still read correctly.

For inline code comments and JSDoc, see [`../code-comments.md`](../code-comments.md) — lighter rules, no skill needed.
