---
name: commit
description: Create well-formatted git commits following the Conventional Commits standard. Use when the user asks to create a commit, when staged changes need a generated commit message, or when the user invokes `/commit`. Generates a conventional commit message (feat / fix / docs / style / refactor / test / chore) by analyzing the staged diff, then creates the commit.
metadata:
  source: https://www.claudedirectory.org/skills/commit
---

# Git Commit Skill

Create well-formatted git commits following the Conventional Commits standard.

## Behavior

1. Analyze staged changes with `git diff --staged`.
2. Generate a Conventional Commits message based on the diff.
3. Create the commit.

## Commit format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Types

- **feat** — A new feature
- **fix** — A bug fix
- **docs** — Documentation changes
- **style** — Code style changes (formatting, missing semicolons, etc.)
- **refactor** — Code refactoring without behavior change
- **test** — Adding or modifying tests
- **chore** — Maintenance tasks, build changes, dependency bumps

## Example output

```
feat(auth): add password reset functionality

- Add forgot password form
- Implement email verification flow
- Add password reset endpoint
```
