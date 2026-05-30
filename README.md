# lazy_days_playground

A learning playground for experimenting with build tooling, test infrastructure, and agent-assisted development conventions. **Not** intended for production deployment — supply-chain defaults are loosened and tool versions track the leading edge.

## Quick start

- Install any recent pnpm globally; `pnpm install` self-converges on the version pinned in `package.json#packageManager` (no Corepack step needed).
- Create a local environment file matching the gitignored `.env.*.local` pattern (the dev script loads `.env.dev.local`). The dev process validates the environment against a schema before it starts and refuses to proceed if anything is missing or malformed; the authoritative list of expected variables lives in [ADR-0009](./docs/adr/0009-bootstrap-environment-validation.md) and the schema it points at.
- Run `pnpm test` once the install finishes.

Prerequisites — a Node version satisfying the `engines.node` field — are pinned in `package.json`. See its `scripts` block for the other entry points (lint, typecheck, coverage, and the probed coverage run).

## Repo layout

Paths below are operational hints — the conceptual scope of each folder is what matters; the path may move.

| Path                 | What lives there                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`               | Application source code, organised by area                                                                                                                                    |
| `.configs/`          | Configuration that is not a top-level config file — test helpers, pnpm patches, area-specific tool configs                                                                    |
| `.env.*.local`       | Per-mode environment files read at startup and validated against the schema; gitignored. See [ADR-0009](./docs/adr/0009-bootstrap-environment-validation.md) for the contract |
| `docs/`              | Project documentation (see the docs index below)                                                                                                                              |
| `docs/adr/`          | Records of load-bearing decisions                                                                                                                                             |
| `docs/code-reviews/` | Review plans (what to check per area) and findings (point-in-time outputs of running the plans)                                                                               |
| `docs/testing/`      | Canonical testing conventions — file layout, worker model, helper contract, diagnostics                                                                                       |
| `docs/pnpm/`         | pnpm-specific operational notes (currently: parallel-script execution)                                                                                                        |
| `docs/ts/`           | JSON schemas for the TypeScript toolchain. Reference-only — not auto-consumed by any build step (currently: `tsconfig.schema.json` — operational hint)                        |
| `docs/vite/`         | Vite multi-target pattern doc (cross-linked from ADR-0001)                                                                                                                    |
| `CONTEXT.md`         | Domain glossary — precise meanings of project-specific terms; do not invent synonyms                                                                                          |
| `CLAUDE.md`          | Entry point for AI agents working in this repo; points at the rule files under `.claude/`                                                                                     |
| `.claude/rules/`     | Project rules for agent and human contributors — code comments, git mutations, skill invocations, state management                                                            |
| `.claude/skills/`    | Skill definitions invoked by agents working in this repo                                                                                                                      |

## Where to start

Depending on what you're doing:

- **Setting up the project locally** → run the commands above. The pinned tool versions handle the rest.
- **Writing or reviewing code** → read [`CLAUDE.md`](./CLAUDE.md) and the rules it links under [`.claude/rules/`](./.claude/rules/).
- **Adding or changing a test** → read [`docs/testing/README.md`](./docs/testing/README.md). The worker model is opinionated; the conventions are non-obvious without it.
- **Running a code review** → pick the relevant plan under [`docs/code-reviews/plans/`](./docs/code-reviews/plans/). The plan tells you which skills to invoke and what to look for.
- **Making an architectural decision** → record it as an ADR under [`docs/adr/`](./docs/adr/); see [`docs/adr/README.md`](./docs/adr/README.md) for the template (the `grill-with-docs` skill in `.claude/skills/` documents the expected shape).
- **Looking up a term** → [`CONTEXT.md`](./CONTEXT.md). If a term is missing from the glossary but already in use, add it as part of the change that uses it.

## Convention summary

- Documentation passes the [rename test](./CONTEXT.md#rename-test) — concepts and decisions are described in language that survives a refactor; current file paths appear only as labelled operational hints.
- ADRs are the one place a doc names a specific component as the subject — they record the decision about that component.
- Inline code comments follow the lighter rule in [`.claude/rules/code-comments.md`](./.claude/rules/code-comments.md).
- Git mutations are never automated — staging and committing require an explicit human request (see [`.claude/rules/git-mutations.md`](./.claude/rules/git-mutations.md)).
