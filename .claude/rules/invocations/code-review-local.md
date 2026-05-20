# Invoke plan-based local area review

This rule covers **local code review run against the project's review plans**, where the deliverable is a `<area>.finding.md` file under [`docs/code-reviews/findings/`](../../../docs/code-reviews/findings/) — not a chat reply, not a PR comment.

For diff-based or PR-targeted review (deliverable is review comments), use the sister rule [`./code-review.md`](./code-review.md) instead.

## Triggers

- The user asks to "run the review plans", "review the codebase", "regenerate findings", or invokes anything else whose natural output is a findings file.
- The user names one or more plans by area: "review bootstrap", "run the configuration plan", etc.
- The findings folder is missing entries for one or more plans and the user wants them produced.

## How to run

1. **Determine scope.** If the user names one or more plans, use those. Otherwise run **every** `docs/code-reviews/plans/<area>.plan.md` in scope.
2. **Dispatch one unbiased Opus sub-agent per plan, in parallel.** Use the Agent tool with `subagent_type=general-purpose`, `model=opus`, sending all sub-agent calls in a single message so they run concurrently. Each sub-agent is isolated — no shared state, no cross-pollination — which preserves the "stay in your scope; surface other-area observations under Out of scope" discipline the findings README mandates.
3. **Brief each sub-agent** with:
   - The absolute path to its plan (`docs/code-reviews/plans/<area>.plan.md`).
   - The absolute path to the findings README (`docs/code-reviews/findings/README.md`) — the canonical source for file structure, severity labels, and lifecycle rules.
   - A pointer to the skill-stacking table in [`./code-review.md`](./code-review.md) — the trigger → skill mapping applies here too. The plan's own "Required skills" section is canonical for that area; the table is the cross-cutting reference.
   - Explicit instructions to: read the plan in full, invoke every skill the plan lists in "Required skills" and any further skill the diff-style trigger table calls for, apply the plan's review focus to the current state of the files in scope, then write the output to `docs/code-reviews/findings/<area>.finding.md` — **replacing** any existing file (regenerate, don't amend — per the README lifecycle).
   - The constraint that the sub-agent must **produce findings only**; applying suggested fixes is a separate, user-initiated step and is not part of this run.
   - The constraint that the sub-agent must **not stage or commit** the findings file (per [`../git-mutations.md`](../git-mutations.md)).
4. **Wait for all sub-agents to return**, then surface a short roll-up to the user: per-area severity totals (blocker / warning / nit / info) and any cross-area "Out of scope" leads each sub-agent flagged so the reviewer of the target area sees them.

## Sub-agent output contract

Each sub-agent produces exactly one file:

- Path: `docs/code-reviews/findings/<area>.finding.md` (where `<area>` matches the plan's prefix).
- Structure: as defined in [`docs/code-reviews/findings/README.md`](../../../docs/code-reviews/findings/README.md) — Summary table → Findings (sorted blockers → warnings → nits → info) → Strengths observed → Out of scope.
- Each finding entry carries severity, file path + line/range, the criterion or skill that flagged it, why it matters, and a concrete suggested fix.

## Boundaries

- **Do not post findings to GitHub.** This rule is local; the deliverable lives in the repo. Remote PR review is the sister rule.
- **Do not amend an existing finding file.** Replace it. Partial in-place updates create mixed-vintage findings that no reader can trust.
- **Do not apply the suggested fixes during the run.** Findings are the deliverable; applying them is a separate user-initiated workflow.
- **Do not aggregate across areas inside an `<area>.finding.md` file.** Each file is one area only. Cross-area observations go under that area's "Out of scope" section.
- **Do not let one sub-agent's findings depend on another's.** Sub-agents run in isolation by design.
