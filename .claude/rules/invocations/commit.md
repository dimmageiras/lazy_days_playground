# Invoke `commit`

Invoke the `commit` skill when creating a git commit.

Do not run `git commit` directly — the skill generates the Conventional Commits message (`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`) from the staged diff.

## Pre-commit checks

Before invoking the skill, verify:

- **Skill changes** (any addition or removal under `.claude/skills/`) → confirm `.claude/skills/README.md` table is in sync with disk. For new skills, follow [`.claude/skills/README.md#adding-a-new-skill`](../../skills/README.md#adding-a-new-skill); for removals, follow [`.claude/skills/README.md#removing-a-skill`](../../skills/README.md#removing-a-skill). Stage the skill changes and the README update (and any new/deleted invocation rule) in the same commit.
