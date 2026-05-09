# Code comments and JSDoc

When adding or editing inline code comments or JSDoc blocks:

## Default: don't write a comment

Well-named identifiers and clear code are enough for the WHAT. A new comment is justified only when the WHY is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug, or behavior that would surprise a reader.

If removing the comment wouldn't confuse a future reader, don't write it.

## Don't explain WHAT the code does

The code already says that. Don't paraphrase the function name. Don't narrate the steps.

## Don't reference the current task or callers

Avoid: "added for the X flow", "used by Y", "fixes issue #123". Those belong in the PR description and the commit message — they rot as the codebase evolves.

## JSDoc

- One-line summary is usually enough. No multi-paragraph blocks.
- Type information belongs in TypeScript types, not in `@param` / `@returns` annotations — don't duplicate.
- Add `@deprecated`, `@internal`, `@throws`, `@see` only when they carry information the type system can't express.
- Public exports facing external consumers (libraries, shared APIs) get fuller JSDoc; internal helpers stay terse.

## Removing dead comments

When editing a file, delete:

- Comments that describe code which has since been deleted or rewritten
- Stale `TO-DO` comments whose linked ticket, milestone, or anchor has been closed, shipped, or otherwise resolved
- Commented-out code (use git history)
