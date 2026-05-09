# Invoke `code-review-and-quality` + area-specific skills

Invoke the `code-review-and-quality` skill when:

- the user asks for a code review (own changes, another agent's output, or a human's PR)
- before merging any change to `main`
- the user wants quality assessed across multiple dimensions

The skill performs multi-axis review (correctness, security, performance, readability, test coverage, edge cases) rather than single-pass commentary.

## Pair with area-specific skills

`code-review-and-quality` covers cross-cutting concerns. For domain-specific depth, **also** invoke the skill matching the area being reviewed. Inspect the diff and stack each relevant skill on top:

| Trigger in the diff                                                   | Also invoke                                                                        |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `import … from 'react-hook-form'`                                     | `react-hook-form-writer`                                                           |
| `import … from 'react-router'` or changes to `react-router.config.ts` | `react-router-framework-mode`                                                      |
| `import … from '@tanstack/react-query'`                               | `tanstack-query-best-practices`                                                    |
| `import … from 'zod'`                                                 | `zod`                                                                              |
| `import … from 'vitest'` or `*.test.ts(x)` / `*.spec.ts(x)` files     | `vitest`                                                                           |
| `import … from 'fastify'`                                             | `fastify-best-practices`                                                           |
| JSX in `.tsx` files (React component or hook changes)                 | `react-best-practices`, `composition-patterns`                                     |
| `vite.config.ts` or any Vite plugin                                   | `vite`                                                                             |
| `pnpm-workspace.yaml` or `pnpm` field in `package.json`               | `pnpm`                                                                             |
| Node.js server code in `.ts` files (Node 24+, no Vite/RR runtime)     | `node`                                                                             |
| TypeScript generics, conditional/mapped types, `any` removal          | `typescript-magician`                                                              |
| Test-first / red-green-refactor commits                               | `tdd`                                                                              |
| Module-boundary or deepening opportunity changes                      | `improve-codebase-architecture`                                                    |
| Bug-fix changes claiming to resolve a regression                      | `diagnose`                                                                         |
| `*.md`, `docs/**`, `CONTEXT.md`, `docs/adr/**`                        | `doc-coauthoring`, `documentation-and-adrs`                                        |
| Inline code comments, JSDoc blocks                                    | (no skill) — apply [`../code-comments.md`](../code-comments.md) as review criteria |

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

`GH_TOKEN` is set in `.claude/settings.local.json` — the comments will be posted from the Claude reviewer account, not the user's personal account.

Do not paste review findings only into the chat when a PR exists; the goal is for the comments to live on GitHub where the author can act on them.
