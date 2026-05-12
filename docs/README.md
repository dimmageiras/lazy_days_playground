# Docs

Reference material and process documentation for this project. Conceptual content only — code lives elsewhere.

| Folder          | Purpose                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| `code-reviews/` | Area-specific review workflow: plans (templates) and findings (outputs from running a plan) |
| `pnpm/`         | Standalone guides for pnpm features the project uses                                        |
| `ts/`           | TypeScript assets (schemas and, in future, narrative reference)                             |

## Adding new content

- An ADR (architectural decision record) goes under `docs/adr/` using sequential `NNNN-slug.md` numbering. The template fields (Status, Context, Decision, Alternatives Considered, Consequences) are described in the `documentation-and-adrs` skill; the folder layout and numbering convention are described in the `grill-with-docs` ADR-FORMAT reference. Where the two skills differ on location, follow this project's `docs/adr/`.
- A domain-glossary entry goes in `CONTEXT.md` at the repo root. Create it lazily when a second doc reuses the same term.
- A topic-specific reference (similar to `pnpm/` or `ts/`) goes in its own folder named after the topic.

## Conventions

Documentation is **codebase-agnostic**: describe concepts, decisions, and conventions rather than the current state of specific files. If every file in the repo were renamed tomorrow, the doc should still read correctly. Operational documents (such as the review plans) may reference current paths as labelled hints; the conceptual definition is the source of truth.
