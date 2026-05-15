# Git mutations

## Never auto-stage or auto-commit

**Auto-staging and auto-committing are disabled.** Do not run `git add` or `git commit` unless the user's current message explicitly requests that specific action.

This applies to **every** entry point: the `/commit` slash command, the `superpowers:commit` / `commit-commands:commit` / `commit-commands:commit-push-pr` / `.claude/skills/commit/SKILL.md` skills, any Agent or Skill invocation that uses them, and any commit-flow template whose steps include "stage" or "create the commit." Treat those steps as descriptive of the eventual action, not as standing authorisation to run it. The same rule applies to staging-equivalent commands (`git stage`, `git restore --staged`, `git rm --cached`, etc.) and to amending/pushing (`git commit --amend`, `git push`).

Normal file edits (`Edit`, `Write`, deletes, refactors, builds, tests, formatters, read-only git like `git diff` / `git status` / `git log`) are **not** affected by this rule. Make code changes as the task requires — just don't take the final step of staging or committing them without an explicit, unambiguous request to do so in the user's current message.

When a commit-flow skill is invoked, propose the commit message and what would be staged, then **stop and wait** for confirmation. A slash-command invocation is context loading, not authorisation. Scope-of-task phrases like "execute the plan" do not authorise git mutations.
