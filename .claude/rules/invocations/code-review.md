# Invoke `code-review-and-quality` + area-specific skills

Invoke the `code-review-and-quality` skill when:

- the user asks for a code review (own changes, another agent's output, or a human's PR)
- before merging any change to `main`
- the user wants quality assessed across multiple dimensions

The skill performs multi-axis review (correctness, security, performance, readability, test coverage, edge cases) rather than single-pass commentary.

## Pair with area-specific skills

`code-review-and-quality` covers cross-cutting concerns. For domain-specific depth, **also** invoke the skill matching the area being reviewed. Inspect the diff and stack each relevant skill on top:

| Area in the diff                                                 | Also invoke                                                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| React components, hooks, JSX                                     | `react-best-practices`, `composition-patterns`                                     |
| React Router routes, loaders, actions, `react-router.config.ts`  | `react-router-framework-mode`                                                      |
| TanStack Query (`useQuery`, `useMutation`, query keys)           | `tanstack-query`                                                                   |
| Zod schemas, `safeParse`, `z.infer`, validation boundaries       | `zod`                                                                              |
| TypeScript generics, conditional/mapped types, `any` removal     | `typescript-magician`                                                              |
| Vitest tests, mocks, coverage config                             | `vitest`                                                                           |
| `vite.config.ts`, Vite plugins, SSR, build settings              | `vite`                                                                             |
| `pnpm-workspace.yaml`, overrides, patches, catalogs              | `pnpm`                                                                             |
| Node.js / TypeScript server code (Node 24+)                      | `node`                                                                             |
| Fastify routes, plugins, hooks, schemas                          | `fastify`                                                                          |
| Test-first or red-green-refactor changes                         | `tdd`                                                                              |
| Architectural shifts, module boundaries, deepening opportunities | `improve-codebase-architecture`                                                    |
| Bug-fix changes claiming to resolve a regression                 | `diagnose`                                                                         |
| `*.md`, `docs/**`, `CONTEXT.md`, `docs/adr/**`                   | `doc-coauthoring`, `documentation-and-adrs`                                        |
| Inline code comments, JSDoc blocks                               | (no skill) — apply [`../code-comments.md`](../code-comments.md) as review criteria |

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
