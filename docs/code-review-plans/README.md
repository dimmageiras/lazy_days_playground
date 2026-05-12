# Code Review Plans

This folder holds **area-specific code review plans**. Each plan specifies:

- The conceptual scope of the area
- The current operational footprint (file paths) — note paths may move; the conceptual scope is the source of truth
- Required skills to invoke during review
- Focus checklist tailored to that area

## How to use

When a pull request touches an area, run the matching plan. The plan tells you which skills to invoke (always `code-review-and-quality` plus area-specific skills) and what to look for beyond the general criteria.

Plans are not exclusive — a PR that spans multiple areas should be reviewed under each relevant plan, with the skill set unioned.

## Areas

| Area | Plan | Triggers (high-level) |
| --- | --- | --- |
| Server composition | [server-composition.review.md](./server-composition.review.md) | The server entry, top-level wiring, route registration into the Fastify instance |
| Bootstrap module | [bootstrap.review.md](./bootstrap.review.md) | The single-instance handoff logic: lifecycle setup, port claim, cooperative-then-force shutdown, the shutdown HTTP route |
| Shared utilities | [shared.review.md](./shared.review.md) | Cross-cutting constants and helpers consumed by multiple modules |
| Project configuration | [configuration.review.md](./configuration.review.md) | Build, runtime, and package-manager configuration files |
| Documentation | [documentation.review.md](./documentation.review.md) | Markdown content under `docs/**`, ADRs, CONTEXT files |

## Conventions

- Every plan invokes `code-review-and-quality` as the multi-axis baseline. The area-specific skills sharpen criteria for that domain.
- Plans are operational documents — they may reference current paths to help reviewers locate scope. The conceptual definition of the area is what survives a refactor.
- A plan should be updated when its area's responsibilities change, not when individual files move within it.

## Related project rules

- [`.claude/rules/invocations/code-review.md`](../../.claude/rules/invocations/code-review.md) — when to invoke `code-review-and-quality` and the trigger-to-skill mapping that informs each plan.
- [`.claude/rules/code-comments.md`](../../.claude/rules/code-comments.md) — applies to inline comments and JSDoc during every review.
- [`.claude/rules/invocations/doc-editing.md`](../../.claude/rules/invocations/doc-editing.md) — applies when the PR touches documentation.
