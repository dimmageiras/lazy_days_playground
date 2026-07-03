# Skills changelog

## [3.0.0] - 2026-07-03

### Skills Added

| Skill                         | Version   | Last edit  |
| ----------------------------- | --------- | ---------- |
| domain-modeling               | —         | 17/06/2026 |
| grilling                      | —         | 03/07/2026 |

### Skills Updated

| Skill                         | Version   | Last edit  |
| ----------------------------- | --------- | ---------- |
| grill-with-docs               | —         | 31/05/2026 |
| improve-codebase-architecture | —         | 31/05/2026 |
| tdd                           | —         | 03/07/2026 |

### Skills Renamed

- **diagnose → diagnosing-bugs** — renamed to follow the upstream rename.

### Local divergences from upstream

- **grill-with-docs** — frontmatter `disable-model-invocation`: `true` → `false`.
- **improve-codebase-architecture** — frontmatter `disable-model-invocation`: `true` → `false`.
- **tdd** — review-stage reference: `code-review` → `code-review-and-quality`.
- **code-review-and-quality** — dead `## See Also` links to `references/*.md`.
- **tanstack-query-best-practices** — Quick Reference trimmed to the 21 rules with backing files.
- **react-best-practices** — `AGENTS.md` cross-links repointed to `./rules/…`.

## [2.0.0] - 2026-07-01

### Skills Added

| Skill                         | Version   | Last edit  |
| ----------------------------- | --------- | ---------- |
| codebase-design               | —         | 17/06/2026 |

### Skills Updated

| Skill                         | Version   | Last edit  |
| ----------------------------- | --------- | ---------- |
| code-review-and-quality       | —         | 21/06/2026 |
| pnpm                          | 2026.6.22 | 23/06/2026 |
| tdd                           | —         | 30/06/2026 |
| vitest                        | 2026.6.22 | 23/06/2026 |

### Skills Removed

- **zoom-out** — dropped from the set.

### Skills Frozen

- **caveman** — pinned to upstream SHA `0a4b767`; upstream deleted the skill, so it is frozen and can no longer be refreshed.

## [1.1.1] - 2026-06-17

### Local modifications

- **node** — `rules/logging.md` redaction example: `a_demo_pass_123` → `password123`.

## [1.1.0] - 2026-06-11

### Skills Added

| Skill                         | Version   | Last edit  |
| ----------------------------- | --------- | ---------- |
| logging-best-practices        | —         | 07/06/2026 |

## [1.0.2] - 2026-06-04

### Skills Updated

| Skill                         | Version   | Last edit  |
| ----------------------------- | --------- | ---------- |
| grill-with-docs               | —         | 28/05/2026 |
| improve-codebase-architecture | —         | 20/05/2026 |

## [1.0.1] - 2026-05-15

### Local divergences from upstream

- **node** — `rules/logging.md` redaction example: `secret123` → `a_demo_pass_123`.

## [1.0.0] - 2026-05-10

### Skills Added

| Skill                         | Version   | Last edit  |
| ----------------------------- | --------- | ---------- |
| caveman                       | —         | 28/04/2026 |
| code-review-and-quality       | —         | 07/04/2026 |
| commit                        | —         | 06/01/2026 |
| composition-patterns          | 1.0.0     | 28/01/2026 |
| diagnose                      | —         | 28/04/2026 |
| doc-coauthoring               | —         | 04/12/2025 |
| documentation-and-adrs        | —         | 31/03/2026 |
| fastify-best-practices        | 0.1.0     | 13/03/2026 |
| grill-with-docs               | —         | 30/04/2026 |
| improve-codebase-architecture | —         | 28/04/2026 |
| node                          | 0.1.0     | 13/03/2026 |
| pnpm                          | 2026.1.28 | 28/01/2026 |
| react-best-practices          | 1.0.0     | 14/04/2026 |
| react-hook-form-writer        | —         | 19/04/2026 |
| react-router-framework-mode   | —         | 30/01/2026 |
| tanstack-query-best-practices | —         | 16/01/2026 |
| tdd                           | —         | 28/04/2026 |
| typescript-magician           | 0.1.0     | 13/03/2026 |
| vite                          | 2026.1.31 | 13/03/2026 |
| vitest                        | 2026.1.28 | 28/01/2026 |
| zod                           | 1.0.0     | 24/02/2026 |
| zoom-out                      | —         | 28/04/2026 |
| zustand                       | —         | 19/03/2026 |

### Local divergences from upstream

- **react-best-practices** — frontmatter `name`: `vercel-react-best-practices` → `react-best-practices` (vendor prefix dropped to match the local folder).
- **composition-patterns** — frontmatter `name`: `vercel-composition-patterns` → `composition-patterns` (vendor prefix dropped).
- **zustand** — frontmatter `name`: `react-zustand` → `zustand` (vendor prefix dropped; folder renamed from upstream `react-zustand`).
- **react-hook-form-writer** — frontmatter `name`: `dust-react-hook-form-writer` → `react-hook-form-writer` (vendor prefix dropped; folder renamed from upstream `dust-react-hook-form-writer`).
- **commit** — adapted from the upstream `.ts` skill blob into `SKILL.md`: `description` rewritten to a trigger-style ("Use when…"), the `## Usage` section dropped, the commit-type descriptions expanded, and a `metadata.source` link added.
