# Project Rules

Follow the rules defined in `.claude/rules/`:

- **Code comments and JSDoc** — [`.claude/rules/code-comments.md`](.claude/rules/code-comments.md) — when to write inline comments, JSDoc conventions.
- **Skill invocation** — [`.claude/rules/invocations/`](.claude/rules/invocations/) — one file per skill (or grouped skills), describing when to invoke. Read every file in this folder before acting.
- **State management** — [`.claude/rules/state-management.md`](.claude/rules/state-management.md) — server-state vs client-state lanes; `zustand-x` wrapper conventions.
