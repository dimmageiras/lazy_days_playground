# Code reviews

The review workflow has two halves:

- `plans/` — one template per area, describing what to look for. Run the plan that matches the PR's area.
- `findings/` — outputs produced by running a plan. One findings file per area per review.

See [`plans/README.md`](./plans/README.md) for the area index, and [`findings/README.md`](./findings/README.md) for the conventions findings files follow.

## Lifecycle

Plans **evolve** when an area's responsibilities change. Findings are **regenerated** each time the plans are re-run against current code — they are point-in-time snapshots, not long-term archives.
