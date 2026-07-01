# PR authoring

House style for pull-request **titles** and **descriptions**. Every rule below is grounded in the existing PR history; follow it when opening any PR so the thread reads consistently with what came before.

Title grammar reuses the project's Conventional-Commits vocabulary — see [`./invocations/commit.md`](./invocations/commit.md) for the type list and the review-resolution subject. Opening the PR is a separate, explicitly-authorised step per [`./git-mutations.md`](./git-mutations.md); this rule governs the wording, not the act of pushing or creating it.

## Title convention

Grammar: `<type>(<scope>): <description>` — Conventional Commits. `<scope>` is optional and rare (only the auto-generated ADR-acceptance PRs use one, `docs(adr)`).

| Facet                                 | Rule                                                                                                                                                                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**                              | One of `feat` / `fix` / `docs` / `style` / `refactor` / `chore`. `feat` for new runtime capability; `refactor` for structural moves with no behaviour change; `docs` for ADR/doc-only; `chore` for tooling, deps, and scaffolding. |
| **Type reflects the dominant change** | Not the flashiest part. Adding a skill is `chore:`; a test-hardening PR that also refactors is `refactor:`.                                                                                                                        |
| **Casing**                            | Lowercase `type`; description starts lowercase; no trailing period. Proper nouns keep their case (`Prettier`, `Fastify`, `pnpm`, `ADR`, `Node`).                                                                                   |
| **Mood**                              | Imperative — "add", "bump", "set up", "harden", "tighten", "centralize".                                                                                                                                                           |
| **Length**                            | One short line, roughly 40–70 characters.                                                                                                                                                                                          |
| **Multi-commit umbrella**             | One title names the _capability_, not the commit list.                                                                                                                                                                             |
| **PR / issue numbers**                | Not in the title — the sole exception is the auto-generated `docs(adr): accept ADRs merged in #NN`.                                                                                                                                |

Example titles:

- `feat: add graceful shutdown and cooperative port handover`
- `chore: set up Prettier and format the codebase`
- `refactor: centralize error normalization in a helper`

## Description skeleton

```markdown
## What this PR does

<1–3 paragraphs. Para 1: what this PR stands up or changes, and the umbrella
branch it targets. Para 2 (the "Once this lands, …" paragraph): the concrete
post-merge state — a command that now works, an env var now required, a pattern
now canonical. State any "no behaviour change" claim here, explicitly.>

## What's inside

<Small PR: a flat bullet list of the touched files as linked repo-relative
paths, each with a one-line note. Large PR: ### sub-sections by area, each with
linked-path bullets. Bold the identifier / module / decision the bullet is about.>

## Verification

`pnpm typecheck` (`tsc -b`), `pnpm lint`, and `pnpm test` are green —
**N tests across M files** pass. <split the counts per project when relevant>
```

Which sections appear depends on the size and kind of PR:

| Section                | Small (chore / bump / skill)                          | Large (feat / refactor / scaffold) |
| ---------------------- | ----------------------------------------------------- | ---------------------------------- |
| `## What this PR does` | Required                                              | Required                           |
| `## What's inside`     | Required (flat bullets)                               | Required (`###` sub-sections)      |
| `## Verification`      | Optional — if skipped, state why gates are unaffected | Required, with exact test counts   |
| `## Why a single PR`   | —                                                     | Common on multi-commit umbrellas   |

## Section-by-section guidance

### `## What this PR does`

- **Belongs here:** the capability or change, the umbrella branch it targets, and a forward-looking "Once this lands, …" sentence naming the concrete new reality.
- **Device:** prose. Bold the **module / helper / decision name** on first mention. Cite the governing ADR inline (`per ADR-0008`).
- **Behaviour claim:** state it flatly and early — either the runtime effect, or "no behaviour change".

### `## What's inside`

- **File links:** every file is a linked repo-relative path in backticks — ``[`app/server/helpers/error.helper.ts`](app/server/helpers/error.helper.ts)``. Tag new files `(new)`; show renames as `old → new`; show version bumps as `name — X → Y`.
- **Structure:** small PR is a flat bullet list; large PR uses `###` sub-sections grouped by concern (e.g. the module, server wiring, environment additions, decisions & docs, dependencies & tooling).
- **Do** give each bullet a "what + one-line why". **Don't** narrate the commits one by one — group by concern instead.

### `## Verification`

- **Belongs here:** the gate results and test counts. Canonical phrasing: `` `pnpm typecheck` (`tsc -b`), `pnpm lint`, and `pnpm test` are green — **N tests across M files** pass ``. Split per project when relevant (e.g. "shared: 192 across 11; server: 110 across 18"). Add extra gates when you ran them (`pnpm exec prettier --check .`).
- **Do** report exact counts, and mention any failure path you drove manually. **Don't** claim green without the numbers.
- **Skip rule:** on docs- or skills-only PRs, either omit the section or state why the gates are unaffected ("no code paths change, so the typecheck / lint / test gates are unaffected").

### `## Why a single PR`

- **Belongs here:** the interdependency argument for not splitting a multi-commit umbrella — typically "splitting would force transient broken states on the intermediate commits".

## Worked examples

### Small PR — dependency / tooling bump

Title: `chore: bump pnpm to X.Y.Z and dev tooling`

```markdown
## What this PR does

Bumps the pinned pnpm version and a handful of dev dependencies to their latest
patch/minor releases, with the regenerated lockfile. Tooling only — no
application, test, or behaviour change.

## What's inside

- [`package.json`](package.json):
  - `packageManager` — **pnpm X.Y.W → X.Y.Z**
  - `typescript-eslint` (+parser) — A.B.C → A.B.D
  - `vitest` (+`@vitest/coverage-v8`) — A.B.C → A.B.D
- [`pnpm-lock.yaml`](pnpm-lock.yaml) — regenerated for the above (the bulk of the diff).
```

### Large PR — feature / refactor slice

Title: `feat: add <capability> and its <companion capability>`

```markdown
## What this PR does

Adds the **<capability>** and its companion **<companion>** to the server, on the
`feat/api-foundation` umbrella. <One sentence on what it now does at runtime.>
The decisions behind this are recorded as ADRs.

Two validated environment variables feed it: `VITE_APP_FOO` (required) and
`VITE_APP_BAR` (default `…`). Once this lands, `pnpm dev` requires `VITE_APP_FOO`;
see [`sample.env`](sample.env).

## What's inside

### The <capability> module

- [`app/server/modules/<cap>/<cap>.module.ts`](app/server/modules/<cap>/<cap>.module.ts)
  (`<Cap>Module`) — the curated surface: `setup<Cap>` installs it in the build step.
- [`.../helpers/<x>.helper.ts`](.) — <one-line role>.

### Server wiring & HTTP surface

- [`app/server/helpers/app/app-build.helper.ts`](app/server/helpers/app/app-build.helper.ts) —
  installs `setup<Cap>` and injects its collaborators via DI.

### Decisions & docs

- [`docs/adr/00NN-<slug>.md`](docs/adr) (new, `Status: Proposed`) — the decision.
- [`CONTEXT.md`](CONTEXT.md) — new glossary term(s).

### Dependencies

- [`package.json`](package.json) — adds `<dep>`, exact-pinned per ADR-0004.

## Verification

`pnpm typecheck` (`tsc -b`), `pnpm lint`, and `pnpm test` are green —
**N tests across M files** pass.

## House rules

1. Title is Conventional Commits — imperative, lowercase, no trailing period; type reflects the dominant change; no PR numbers (except the ADR-accept auto-PR).
2. Open with `## What this PR does`, naming the umbrella branch and a concrete "Once this lands, …" outcome.
3. State the behaviour claim explicitly — the runtime effect, or "no behaviour change".
4. Every file mention is a linked repo-relative path in backticks; tag `(new)`, renames as `old → new`, bumps as `name — X → Y`.
5. `## What's inside` is organised by concern — flat bullets for small PRs, `###` sub-sections for large ones. Group; don't narrate commits.
6. `## Verification` carries exact test counts on feat/refactor/large PRs; on docs- or skills-only PRs, say why the gates are unaffected.
7. Cite the governing ADR for any decision, deferral, or accepted risk; new ADRs land `Status: Proposed` and note the accept-workflow follow-up.
8. Keep it self-contained and plain-spoken; describe this PR on its own terms.
9. Multi-commit umbrellas carry `## Why a single PR`.
```
