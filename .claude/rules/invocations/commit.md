# Invoke `commit`

Invoke the `commit` skill when creating a git commit.

Do not run `git commit` directly — the skill generates the Conventional Commits message (`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`) from the staged diff.

## Message format

Suggest a **single-line** subject only — `<type>(<scope>): <description>` — and nothing else. Do not add a body, bullet list, or footer unless the user explicitly asks for one in their current message. The one-line subject is the standing default for every commit-message suggestion; an extended body is opt-in and never volunteered.

## Pre-commit checks

Before invoking the skill, verify:

- **Skill changes** (any addition or removal under `.claude/skills/`) → confirm `.claude/skills/README.md` table is in sync with disk. For new skills, follow [`.claude/skills/README.md#adding-a-new-skill`](../../skills/README.md#adding-a-new-skill); for removals, follow [`.claude/skills/README.md#removing-a-skill`](../../skills/README.md#removing-a-skill). Stage the skill changes and the README update (and any new/deleted invocation rule) in the same commit.
