# Code review comments

House style for **review comments on pull requests**. Every rule below is grounded in the repo's review history; follow it when reviewing a PR so every thread reads consistently with what came before.

This is the sibling of [`./pr-authoring.md`](./pr-authoring.md) — that rule governs how a PR is _opened_, this one how a PR is _reviewed_. The review **mechanics** — which API posts inline vs top-level, the `gh` invocation, and what must never be posted — live in [`./invocations/code-review.md`](./invocations/code-review.md); the **severity vocabulary** is inherited from [`../../docs/code-reviews/findings/README.md`](../../docs/code-reviews/findings/README.md).

## Verdict convention

A review is delivered as **one top-level verdict** plus **N inline or folded comments**. The verdict state is chosen by the _worst_ finding, and it moves through a predictable two-phase arc: the first pass states the findings; the re-review clears them.

| State             | When to use it                                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `COMMENT`         | The default first-pass verdict. Findings exist (warnings and/or nits) but none block merge — or the verdict is deliberately left to the human reviewer. Never approves, never blocks.                                                                   |
| `REQUEST_CHANGES` | Only when a genuine blocker or a will-silently-bite defect is present — a broken gate (`typecheck` / `lint` / `test` red), a semantic regression, a type-vs-runtime lie, a factually wrong claim. Requesting changes for anything softer is over-reach. |
| `APPROVE`         | Reserved for the re-review pass, once every finding is fixed-and-verified or declined-and-accepted. Rarely a first-pass verdict — only on trivial PRs (dep bumps, ADR-accept auto-PRs).                                                                 |

**Walk-back is expected, not embarrassing.** If a first-pass `REQUEST_CHANGES` mis-graded a finding, say so plainly in the approve body ("walking back the earlier request-changes — my 'blocker' framing of the knip finding was wrong; the advisory script is not a merge gate"). Correcting your own severity is part of the style.

### First-pass summary body

The top-level `COMMENT` / `REQUEST_CHANGES` body is a **structured roll-up**, not prose sprawl:

1. **One-line framing** — what was reviewed and against which lenses ("Independent multi-axis review of the graceful-shutdown change — Fastify, Node lifecycle, Zod env contract, logging, ADRs").
2. **Skills invoked** — name the `code-review-and-quality` base plus every area skill stacked on top (`fastify-best-practices`, `vitest`, `typescript-magician`, …).
3. **Severity roll-up** — a count of findings by severity. Two forms are in use — an inline tally or a small table:

   ```
   Severity counts: 0 blockers, 1 warning, 3 nits.
   ```

   | Severity | Count |
   | -------- | ----- |
   | Blocker  | 0     |
   | Warning  | 5     |
   | Nit      | 4     |
   | Strength | 4     |

4. **Why this verdict** — one or two sentences naming the _specific_ findings that drove `REQUEST_CHANGES` ("requesting changes only because of the `HTTP_SCHEMES` and `ObjectEntries` defects — both will silently bite future consumers"), or stating the deferral ("not approving or requesting changes — leaving the verdict to the human reviewer").
5. **Strengths** — a short, honest list of what to keep doing. Load-bearing, not filler.
6. **Verification, when run** — exact gate results ("`pnpm typecheck` clean, `pnpm test` 170 passed, `pnpm lint` clean").

### Re-review (approve) body

The approve body is a **fix-by-fix ledger**, keyed to the original findings, asserting verification **against the code, not the author's claim**:

> Approving. All three findings addressed in f7c425e and verified against the code:
>
> - **W1** — the non-validation branch now normalizes the caught value and logs message + stack.
> - **W2** — the sync-destination exception is now documented in both the logging README and the plan.
> - **N1** — the message now follows the "Failed to …" lifecycle convention.
>
> No new findings.

The phrase **"verified against the code, not the claim"** recurs and is the signature of this repo's re-review discipline.

## Severity vocabulary

The canonical labels are inherited from the findings README. Every review comment carries exactly one, bolded, at the head of the body.

| Label       | Meaning                                                                                                  | Posted inline on the PR?       |
| ----------- | -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **blocker** | Must fix before merge — bug, security hole, broken gate, factually wrong claim.                          | Yes                            |
| **warning** | Should fix before merge — a likely problem, fragility, footgun, missing edge case, or doc-vs-impl drift. | Yes                            |
| **nit**     | Could improve — style, naming, a tighter refactor, a consistency point.                                  | Yes                            |
| **info**    | Worth knowing, _not a change request_ — an observation, a version quirk, a forward-looking note.         | **No — withheld from the PR.** |

**Info stays off the PR thread.** Per [`./invocations/code-review.md`](./invocations/code-review.md), only `blocker` / `warning` / `nit` are actionable and belong as PR comments; `info` goes in the chat summary or a local findings file. Where an FYI genuinely helps at a line, fold it into a `warning` / `nit` body as a trailing "Not blocking, FYI:" clause rather than posting a standalone `info` comment.

**Observed variants — use them, but normalise:**

- **`Consider`** is a soft-warning label for a deliberate-loosening call the author may have intended. Treat it as a `warning` in a non-accusatory register — right when the finding is "you may not have noticed this trade-off."
- **Numbered IDs** (`B1`, `W-A`, `N1`) mark a finding **folded** into the top-level body because it is _non-anchorable_ (the offending line is outside the diff) or cross-cutting. Anchorable findings get a plain `**Warning**:` inline; folded ones get an ID so the approve-ledger can reference them.
- **Pick one casing per review** (`**Warning**` vs `**warning**`); don't mix within a review.

## Inline comment template

A single inline comment is **one severity, one problem, one fix**, in this order:

````markdown
[<skill-or-criterion>] **<Severity>**: <one-sentence problem — what is wrong, at this line>.

<1–3 sentences on WHY it matters — the concrete consequence: the call site that
silently never matches, the log line that serializes to `{}`, the OS where it throws.
Name the rule / skill / doc that flags it, if there is one.>

<The fix. Prose, or a fenced ```ts block for an illustrative multi-line fix, or a

```suggestion block when the replacement is a directly-committable edit to the
anchored line(s).>
```
````

Anatomy rules from the data:

- **Lead with the bracketed source** when a specific skill or rule flagged it — `[typescript-magician]`, `[logging plan / node]`, `[code-comments]`. It tells the author which lens produced the finding and makes a decline checkable.
- **The severity label is mandatory and bolded**, right after the bracket.
- **Problem → why → fix is the fixed order.** The _why_ is never skipped — a warning without a stated consequence reads as opinion. The strongest findings quantify it.
- **`file:line` precision.** Anchorable comments attach to the exact line; non-anchorable ones name the path/line in the body ("lines 33 and 126 are outside this PR's diff — flagged here") and move to the top-level body or a discussion comment.
- **Attach a fix block when the fix is concrete** — a fenced `ts` / `sh` block for an illustrative fix, a `suggestion` block only for a directly-committable edit to the anchored line(s). Never put a `suggestion` block on a non-anchorable comment.
- **Keep it short** — one tight paragraph of _why_ plus the fix.

## Guidance — do / don't

**Tone**

- **Do** write plain, everyday language — a review reads like an engineer explaining a footgun to a peer, not a linter. Even dense type findings open with the plain consequence before the mechanism.
- **Do** stay specific: name the exact constant, the exact OS, the exact serializer.
- **Don't** hedge or moralise. State the problem and the fix. "Stylistic — not blocking" is a fine closer for a nit; padding is not.

**Scope**

- **Do** stay inside the diff. Findings on out-of-diff lines are labelled non-anchorable and folded into the top-level body or a discussion comment.
- **Do** respect the PR's declared scope and carve-outs; open by noting what was deliberately not challenged.
- **Do** surface cross-area leads under an **Out of scope** heading so the next reviewer sees them — never bury them in an in-scope thread.
- **Don't** re-litigate a decision settled by an ADR or a prior decline.

**Precision & verification**

- **Do** run the gates yourself and report exact numbers ("pnpm test — 54 passed"). "Green" without counts is not claimed.
- **Do** back every finding with a reproduction or a traced consequence.
- **Don't** approve on the author's say-so — re-verify each fix against the committed code.

## Resolution etiquette

- **Itemise declines, not just fixes.** A re-review body lists each _declined_ finding with an explicit decision — _accept_ (the author's reasoning holds) or _hold_ (it still stands, here's why). The decision is stated, never left implicit.
- **Close a thread on a verified fix**, not on a promise — the fix is checked against the committed code, and an accepted decline is closed with its rationale recorded.
- **Keep replies per-finding.** Each thread gets a targeted response; fixes cite the commit that applied them.

## Worked mini-examples

### A warning with a suggestion block

````markdown
[logging plan / code-review-and-quality] **Warning**: this branch logs the caught
value as `{ error }`, but `error` is still `unknown` and unnormalized. Pino's error
serializer only fires on the `err` key — an `Error` under `error` serializes to `{}`,
dropping message and stack (the loss the logging README warns about). The sibling
catch already normalizes; mirror it:

```suggestion
        const normalizedError =
          error instanceof Error ? error : new Error(`${error}`);

        fallbackLogger.fatal(
          { ...normalizeError(normalizedError) },
          "💥 Failed to validate the environment",
        );
```
````

### A nit

```markdown
[code-review-and-quality] **Nit**: the test names in this `describe` mix grammar —
the table cases use `should resolve …` but this one drops the `should` prefix. Pick
one form per spec; the rest of the project uses `should …`. Stylistic — not blocking.
```

## House rules

1. **Severity-label every comment** — one of `blocker` / `warning` / `nit`, bolded, at the head. One severity per comment.
2. **Keep `info` off the PR thread** — observations and FYIs go in the chat summary or a local findings file, or fold into a `nit` / `warning` as a "not blocking, FYI" clause; never a standalone PR comment.
3. **Plain language, specific consequence** — problem → _why it matters_ → fix, in that order. Never skip the _why_.
4. **`REQUEST_CHANGES` only for real blockers**; `COMMENT` is the default first pass; `APPROVE` is the re-review verdict once findings clear. Walk back a mis-graded severity openly.
5. **Verify against the code, not the claim** — re-review each fix against the committed diff, run the gates, report exact counts.
6. **Anchor inline, fold out-of-diff** — anchorable findings attach to `file:line`; non-anchorable ones get a numbered ID (`W-A`, `N1`) in the top-level body or a discussion comment, and never carry a `suggestion` block.
7. **Attribute the lens** — bracket the flagging skill/rule so the author can check the finding against its source.
8. **Respect scope and carve-outs** — stay in the diff, honour declared deferrals, don't re-litigate ADR-settled decisions, and surface cross-area leads under **Out of scope**.
9. **Name strengths** — every substantive review lists what the author should keep doing.
10. **Never post test or placeholder content** — no "test", "ping", or smoke-test bodies anywhere; verify `gh` write access with a read-only call instead.
