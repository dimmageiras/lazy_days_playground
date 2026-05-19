# Code Review Findings

## Purpose

This folder holds the **outputs of code reviews** conducted against the plans defined in [`../plans/`](../plans/README.md). Each file in here documents the findings from reviewing one area of the codebase under the criteria the matching plan specifies.

The pair is intentional: **plans define what to check; this folder records what was found.**

## Files in this folder

For every plan named `<area>.plan.md` under `../plans/`, this folder may contain a matching `<area>.finding.md`. The shared `<area>` prefix lets a reader predict the matching findings filename from a plan filename (and vice versa), and the differing suffixes make it easy to spot when an area is plan-but-no-findings (review pending) or findings-but-no-plan (orphaned output).

Additional files that may live here:

- This `README.md` — folder purpose and conventions
- Findings files from earlier review batches (when retained as baselines — see [Lifecycle](#lifecycle))

## How findings are produced

1. A reviewer — human or agent — reads the plan for a given area.
2. The plan names the skills to invoke (always `code-review-and-quality` plus area-specific skills) and lists the review focus checklist.
3. The reviewer reads the files in scope, applies the criteria, and writes findings to this folder using the file-structure convention below.

When a review is parallelised (e.g. one agent per area running concurrently), each agent writes its own findings file independently. There is no aggregator — this folder _is_ the aggregation point.

## File structure

Each findings file follows the same shape:

- **Summary** — counts by severity and a one-paragraph verdict
- **Findings** — one section per issue, sorted by severity (blockers → warnings → nits → info)
- **Strengths observed** — short list of what's done well in the area
- **Out of scope** — issues that belong to another review area, surfaced so the reviewer of that area sees the lead

Each finding inside the file carries:

- A **severity label**
- A **file path** and approximate **line or range**
- The **skill or checklist criterion** that flagged it
- An **explanation** of why it matters
- A **concrete suggested fix** (code, rewrite, or removal)

## Severity labels

| Label       | Meaning                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------- |
| **blocker** | Must be fixed before merge — bug, security issue, broken behaviour, factually wrong claim    |
| **warning** | Should be fixed before merge — likely problem, fragility, footgun, missing edge case         |
| **nit**     | Could be improved — style, naming, minor refactor opportunity                                |
| **info**    | Worth knowing, not a fix request — observation, future consideration, version-specific quirk |

## Lifecycle

Findings are **point-in-time snapshots**. The expected flow:

1. Run a review → produces findings files in this folder
2. Findings are acted on — blockers and warnings get PRs, nits get triaged, info entries get filed mentally
3. Once acted on, findings are stale: delete them, or replace them with a fresh review batch

This folder is **not** a long-term archive by default. If a snapshot needs preserving (for instance, "the state of the code at v1.0"), capture it via a git tag or a separate baseline subdirectory rather than letting findings rot here.

## Pairing with plans

The relationship between the two folders is read-only on the plan side and write-once on the findings side:

- **Plans evolve** when an area's responsibilities change, or when project rules update
- **Findings are regenerated** each time the plans are run against current code

Updating a plan in place is normal; updating a finding in place is not. If new issues are discovered in the same area, re-run the plan and replace the findings file rather than editing it.

## Re-running a review

1. Read the matching plan in `../plans/`
2. Invoke every skill the plan lists, in order
3. Apply the plan's review focus to the current state of the files in scope
4. Replace the corresponding findings file with your output

For multi-area reviews, run each plan independently — keeping reviewers (or agents) in one scope avoids cross-pollination, makes the findings easier to action, and preserves the "stay in your scope; surface other-area observations under Out of scope" discipline that the plans build in.

## Related

- [`../plans/README.md`](../plans/README.md) — area definitions, scope conventions, and skill pairings
- [`../../../.claude/rules/invocations/code-review-local.md`](../../../.claude/rules/invocations/code-review-local.md) — project rule for running the plans locally and producing the files in this folder (one Opus sub-agent per plan, in parallel)
- [`../../../.claude/rules/invocations/code-review.md`](../../../.claude/rules/invocations/code-review.md) — sister project rule for diff- and PR-targeted review (deliverable is review comments); its trigger-to-skill mapping informs each plan
- [`../../../.claude/rules/code-comments.md`](../../../.claude/rules/code-comments.md) — applies to inline comments and JSDoc during every review
