# Project Rules

Follow the rules defined in `.claude/rules/`:

- **Code comments and JSDoc** — [`.claude/rules/code-comments.md`](.claude/rules/code-comments.md) — when to write inline comments, JSDoc conventions.
- **Code review comments** — [`.claude/rules/code-review-comments.md`](.claude/rules/code-review-comments.md) — verdict conventions and comment structure for reviewing pull requests.
- **Git mutations** — [`.claude/rules/git-mutations.md`](.claude/rules/git-mutations.md) — never auto-stage or auto-commit; commit-flow skills are context, not authorisation.
- **PR authoring** — [`.claude/rules/pr-authoring.md`](.claude/rules/pr-authoring.md) — title grammar and description structure for pull requests.
- **Skill invocation** — [`.claude/rules/invocations/`](.claude/rules/invocations/) — one file per skill (or grouped skills), describing when to invoke. Read every file in this folder before acting.
- **State management** — [`.claude/rules/state-management.md`](.claude/rules/state-management.md) — server-state vs client-state lanes; `zustand-x` wrapper conventions.

## Where to look next

- [`README.md`](README.md) — project overview, quick start, and repo layout.
- [`CONTEXT.md`](CONTEXT.md) — domain glossary; the canonical definition for any project-specific term.
- [`docs/testing/README.md`](docs/testing/README.md) — testing conventions (worker model, spec shape, helper contract).
- [`docs/code-reviews/plans/`](docs/code-reviews/plans/) — per-area review plans; each plan names the skills to invoke and what to look for.
- [`docs/adr/README.md`](docs/adr/README.md) — architectural decision records and the ADR template.
- [`docs/vite/multi-target-config.md`](docs/vite/multi-target-config.md) — multi-target Vite pattern referenced by ADR-0001.
