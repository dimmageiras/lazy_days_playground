# Invoke `superpowers:using-superpowers` (optional, plugin-only)

**Conditional rule.** This file applies **only when the `superpowers` plugin is installed** — i.e. when skill names prefixed `superpowers:` appear in the available-skills list. The plugin is not installed in the repo; teammates opt in personally via `/plugin install superpowers@claude-plugins-official` (or equivalent marketplace).

If `superpowers:*` skills are not in the available-skills list, **skip this rule entirely** — there is nothing to invoke. Fall back to the rest of the project rules (`caveman` for output, area skills per [`code-review.md`](./code-review.md) for review depth, etc.).

## When the plugin is installed

Invoke `superpowers:using-superpowers` on every prompt, **before** any other skill (including `caveman`) and before any tool call or response.

The skill is the workflow gate: it loads the discipline for when to invoke process skills (`brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`, `using-git-worktrees`, `writing-skills`) so they fire when they should rather than being skipped.

## Stacking order per turn (plugin installed)

1. `superpowers:using-superpowers` — workflow gate (always first)
2. Process skills triggered by the gate (`brainstorming`, `systematic-debugging`, `test-driven-development`, etc.)
3. Domain / area skills per [`code-review.md`](./code-review.md) (`react-best-practices`, `zod`, `fastify-best-practices`, etc.)
4. `caveman` — output formatting (always last, wraps the response)

Process discipline runs before output formatting. Caveman never replaces or short-circuits superpowers; it only compresses the final text.

## Precedence

User instructions (CLAUDE.md, `.claude/rules/**`, direct requests) win over any superpowers skill content. If a superpowers skill says "do X" and a project rule says "don't do X here", the project rule wins.

Persistence: once triggered, stays active for the whole session. Switch off only when the user says `stop superpowers`.

## Never auto-stage or auto-commit

**Auto-staging and auto-committing are disabled.** Do not run `git add` or `git commit` unless the user's current message explicitly requests that specific action.

This applies to **every** entry point: the `/commit` slash command, the `superpowers:commit` / `commit-commands:commit` / `commit-commands:commit-push-pr` / `.claude/skills/commit/SKILL.md` skills, any Agent or Skill invocation that uses them, and any commit-flow template whose steps include "stage" or "create the commit." Treat those steps as descriptive of the eventual action, not as standing authorisation to run it. The same rule applies to staging-equivalent commands (`git stage`, `git restore --staged`, `git rm --cached`, etc.) and to amending/pushing (`git commit --amend`, `git push`).

Normal file edits (`Edit`, `Write`, deletes, refactors, builds, tests, formatters, read-only git like `git diff` / `git status` / `git log`) are **not** affected by this rule. Make code changes as the task requires — just don't take the final step of staging or committing them without an explicit, unambiguous request to do so in the user's current message.

When a commit-flow skill is invoked, propose the commit message and what would be staged, then **stop and wait** for confirmation. A slash-command invocation is context loading, not authorisation. Scope-of-task phrases like "execute the plan" do not authorise git mutations.
