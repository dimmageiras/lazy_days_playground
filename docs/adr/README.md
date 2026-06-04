# Architectural Decision Records

Records of load-bearing decisions — see the **Load-bearing decision** term in [`../../CONTEXT.md`](../../CONTEXT.md). A decision earns an ADR when its consequences propagate beyond one file, when undoing it would force changes elsewhere, or when the alternatives considered are themselves worth recording.

## Filename convention

`NNNN-kebab-case-title.md`, where `NNNN` is a zero-padded sequence number (`0001-...`, `0002-...`). Sequence is monotonic across the project; gaps are fine when an ADR is withdrawn before merge.

## Lifecycle

- New ADRs start with status `Proposed`.
- The status flips to `Accepted` when the decision is in force. For an ADR that lands together with the change that puts it in force, that flip happens on the same merge. For an ADR that records a forward-looking commitment whose enforcement depends on a later implementation slice, the flip waits for that slice — each ADR's `Status` line is the source of truth for which case applies, and the `Date` field on the ADR is updated to the date of the status change.
- A superseded ADR keeps its file (history is the point) and updates its status to `Superseded by NNNN-...`. The superseding ADR cross-links back.
- A deprecated decision (no longer applies; no replacement) updates status to `Deprecated` and explains why in a short closing note.

ADRs are never deleted — they are the audit trail. If a decision turned out wrong, the new ADR explains what changed. An ADR withdrawn during review before it ever merged has no on-disk presence — the sequence number is simply skipped.

## Template

Copy this scaffold for a new ADR:

```markdown
# NNNN. Title

- **Status:** Proposed | Accepted | Superseded by NNNN-... | Deprecated
- **Date:** YYYY-MM-DD

## Context

What is the situation that forced a decision? What forces are at play (technical, organisational, regulatory)? Keep this section short; if the context needs more than a few paragraphs, the decision is probably composite — split it.

## Decision

What did we decide? State the decision in the active voice and in present tense, as if it were already in force.

## Alternatives considered

For each alternative, name it, then state in one or two sentences why it was rejected. The rejected options are part of the record — they save the next reader from re-evaluating them.

## Consequences

What follows from the decision — both the positive consequences the decision was made for, and the negative ones the team accepts. Future readers need to see the trade-off, not just the upside.
```

## Related

- [`../../CONTEXT.md`](../../CONTEXT.md) — domain glossary, including **Load-bearing decision** and **Rename test**
- [`../code-reviews/plans/documentation.plan.md`](../code-reviews/plans/documentation.plan.md) — review criteria for ADRs and other docs
- [`../code-reviews/plans/validation.plan.md`](../code-reviews/plans/validation.plan.md) — review plan whose startup-gate criteria enforce [ADR-0009](./0009-bootstrap-environment-validation.md)
