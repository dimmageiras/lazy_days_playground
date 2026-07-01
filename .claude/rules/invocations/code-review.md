# Invoke `code-review-and-quality` + area-specific skills (remote / diff mode)

This rule covers **diff-based** and **PR-targeted** review — the deliverable is review comments (in chat or posted to a GitHub PR via the `gh` CLI).

For **plan-based local area review** — running `docs/code-reviews/plans/<area>.plan.md` against the current codebase and producing `<area>.finding.md` files — use the sister rule [`./code-review-local.md`](./code-review-local.md) instead.

## Triggers

Invoke the `code-review-and-quality` skill when:

- the user asks for a code review of own changes, another agent's output, or a human's PR
- before merging any change to `main`
- the user wants quality assessed across multiple dimensions

The skill performs multi-axis review (correctness, security, performance, readability, test coverage, edge cases) rather than single-pass commentary.

## Pair with area-specific skills

`code-review-and-quality` covers cross-cutting concerns. For domain-specific depth, **also** invoke the skill matching the area being reviewed. Inspect the diff and stack each relevant skill on top:

| Trigger in the diff                                                                                          | Also invoke                                                                                               |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `import … from 'react-hook-form'`                                                                            | `react-hook-form-writer`                                                                                  |
| `import … from 'react-router'` or changes to `react-router.config.ts`                                        | `react-router-framework-mode`                                                                             |
| `import … from '@tanstack/react-query'`                                                                      | `tanstack-query-best-practices`                                                                           |
| `import … from 'zod'`                                                                                        | `zod`                                                                                                     |
| `import … from 'zustand'` or `import … from 'zustand-x'`                                                     | `zustand`; also apply [`../state-management.md`](../state-management.md)                                  |
| `import … from 'vitest'` or `*.test.ts(x)` / `*.spec.ts(x)` files                                            | `vitest`                                                                                                  |
| `import … from 'fastify'`                                                                                    | `fastify-best-practices`                                                                                  |
| Pino log calls (`instance.log` / `request.log` / `logger.*`) or changes under `app/server/modules/logger/**` | `logging-best-practices`; also apply [`../../../docs/logging/README.md`](../../../docs/logging/README.md) |
| JSX in `.tsx` files (React component or hook changes)                                                        | `react-best-practices`, `composition-patterns`                                                            |
| `vite.config.ts` or any Vite plugin                                                                          | `vite`                                                                                                    |
| `pnpm-workspace.yaml` or `pnpm` field in `package.json`                                                      | `pnpm`                                                                                                    |
| Node.js server code in `.ts` files (Node engine pinned in `package.json#engines.node`, no Vite/RR runtime)   | `node`                                                                                                    |
| TypeScript generics, conditional/mapped types, `any` removal                                                 | `typescript-magician`                                                                                     |
| Test-first / red-green-refactor commits                                                                      | `tdd`                                                                                                     |
| Module-boundary or deepening opportunity changes                                                             | `improve-codebase-architecture`, `codebase-design`                                                        |
| Bug-fix changes claiming to resolve a regression                                                             | `diagnose`                                                                                                |
| `*.md`, `docs/**`, `CONTEXT.md`, `docs/adr/**`                                                               | `doc-coauthoring`, `documentation-and-adrs`                                                               |
| Inline code comments, JSDoc blocks                                                                           | (no skill) — apply [`../code-comments.md`](../code-comments.md) as review criteria                        |

Multiple areas in one diff → invoke each matching skill. The general skill sets the structure; the area skills sharpen the criteria for that part of the diff.

## How to leave the comments

When the review targets a GitHub PR, post the findings as PR comments via the `gh` CLI rather than dropping them into the chat:

- Inline file/line comments → `gh pr review` does **not** support inline anchoring. Use the GitHub API directly:

  ```sh
  gh api repos/<owner>/<repo>/pulls/<n>/reviews \
    -X POST \
    -F event=COMMENT \
    -f body='<summary>' \
    -F comments='[{"path":"<file>","line":<n>,"body":"<text>"}]'
  ```

  Each entry in `comments` attaches one inline comment to a specific file and line.

- Top-level review verdict → `gh pr review <pr> --approve` / `--request-changes` / `--comment` with a summary body.
- One-off discussion comment (no review verdict) → `gh pr comment <pr> --body-file <tmp>`.

`GH_TOKEN` is provided to the agent's environment by repo-local settings (currently `.claude/settings.local.json`; movable) — the comments will be posted from the Claude reviewer account, not the user's personal account.

Do not paste review findings only into the chat when a PR exists; the goal is for the comments to live on GitHub where the author can act on them.

## What not to post

The `gh` CLI is available to the agent, but two categories of content must **never** be posted as PR review verdicts, inline comments, or discussion comments:

- **No test or placeholder content.** Do not post `test`, `test inline`, "checking gh works", "ping", smoke-test bodies, or any other diagnostic content as a PR comment. The reviewer account's history is read by humans and aggregated by GitHub's notification surface; test posts erode trust in every subsequent review and create noise the author has to scroll past. If `gh` write access needs verifying, use a read-only call (`gh pr view`, `gh pr list`, `gh api ... -X GET`) — never a write-side one.
- **No `info`-severity findings as PR comments.** Per the findings README's severity vocabulary (`blocker | warning | nit | info`), only `blocker`, `warning`, and `nit` entries belong on the PR — they are findings the author can act on before merging. `info` entries are observations, version-specific quirks, or future considerations that do not request a change; they belong in the chat summary or in a local findings file, not on the PR thread. Posting `info` lines as PR comments overruns the actionable signal with noise the author cannot resolve.
