# Documentation — Review Findings

Review date: 2026-07-09. Plan: [`../plans/documentation.plan.md`](../plans/documentation.plan.md).
Skills invoked: `code-review-and-quality`, `doc-coauthoring`, `documentation-and-adrs`.

Scope reviewed: `CONTEXT.md`, `README.md`, `docs/adr/**` (all 22 ADRs + `README.md`), `docs/code-reviews/**` (READMEs and plans), `docs/testing/README.md`, `docs/logging/README.md`, `docs/vite/multi-target-config.md`, `docs/db/db-initialize.md`, `docs/pnpm/*.md`, and `.claude/rules/**` (via project-instructions context). The vendored `.claude/skills/**` markdown tree is third-party skill content, not this project's prose — treated as out of scope. `CLAUDE.md` and the `.claude/rules/**` files were read but produced no findings.

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 2     |
| Nit      | 3     |
| Info     | 2     |

Verdict: the documentation is in strong shape — the ADR set is exemplary (uniform template adherence, and reciprocal-link discipline on supersessions that names the superseded facet on both sides exactly as `docs/adr/README.md` mandates), and the operational docs (`db-initialize.md`, the testing and logging READMEs) are precise and reader-aware. No blockers. The two warnings are both doc-vs-decision / doc-vs-doc drift a reader could act on wrongly: the logging README teaches an error-normalization snippet the codebase deliberately rejected (`ADR-0010`), and the two setup docs prescribe different env filenames without reconciling them. The nits are a missed reciprocal link on the newest ADR and two accuracy/staleness points in the pnpm docs.

## Findings

### Warnings

#### W1 — Logging README teaches the error-normalization pattern ADR-0010 explicitly rejected

- **Severity:** warning
- **File:** [`docs/logging/README.md`](../../logging/README.md) lines 60–66 (the "Normalize the error first" block; the offending line is 65)
- **Flagged by:** `documentation-and-adrs` (doc-vs-ADR drift) + `code-review-and-quality` (accuracy of a code example)
- **Why it matters:** The README shows the reader how to normalize a caught value with:

  ```ts
  const error = rawError instanceof Error ? rawError : new Error(`${rawError}`);
  ```

  This is precisely the pattern [`docs/adr/0010-logging-and-error-handling.md`](../../adr/0010-logging-and-error-handling.md) rejects under "Stringify with template-literal interpolation" (lines 82–84): interpolating a `symbol` into a template literal throws `TypeError`, so a thrown `symbol` produces a *second* exception inside the catch. The actual `normalizeError` / `toError` helper in `app/server/helpers/error.helper.ts` avoids this by using `new Error(String(value))` (throw-free coercion), and ADR-0010 describes that as a deliberate choice. A contributor copying the README snippet reintroduces the exact bug the codebase designed out. A second, related tension: the "Normalize the error first" framing reads as an *inline, per-call-site* step, but ADR-0010's decision (and its rejected "Inline the coercion at each call site" alternative, lines 78–80) is that normalization is centralized in one helper and never inlined.
- **Suggested fix:** Change the example to throw-free coercion — `new Error(String(rawError))` — and reframe the guidance so it points at the project's single normalization seam rather than an inline snippet (staying codebase-agnostic per the doc-editing rule while matching the decision), e.g. "route the caught value through the project's error-normalization helper, which coerces any `unknown` to an `Error` with a total, throw-free string conversion and returns the flat `{ error, stack }` context object." The field shape shown (`{ error: error.message, stack: error.stack }`) is already correct and matches both the helper and ADR-0010 — only the coercion expression and the inline framing need fixing.

#### W2 — README and db-initialize prescribe different env filenames without reconciling them

- **Severity:** warning
- **Files:** [`README.md`](../../../README.md) lines 8 and 21; [`docs/db/db-initialize.md`](../../db/db-initialize.md) lines 10–16 ("About the env file" + section 1)
- **Flagged by:** `doc-coauthoring` (reader without the author's context) + `code-review-and-quality` (cross-doc consistency)
- **Why it matters:** The README quick-start frames local configuration exclusively as the `.env.*.local` pattern — "the dev script loads `.env.dev.local`" (line 8), and the repo-layout row only mentions `.env.*.local` (line 21). `db-initialize.md` frames it exclusively as `.env` — "copy `sample.env` `.env`" and "The app reads the validated values" (lines 12–16). Both are individually true (the dev script runs `vite-node --mode dev`, and Vite loads `.env` in every mode *plus* `.env.dev.local` in dev; Docker Compose auto-loads only `.env`), and `sample.env` is the single template for both server and DB variables. But the two docs never cross-reference, so a first-time contributor who follows the README alone creates `.env.dev.local` — which the app reads but Docker Compose does **not** — and their DB bring-up silently has no variables. Neither doc states which file is authoritative for which consumer, or that the two coexist.
- **Suggested fix:** Add one reconciling sentence to each doc. In the README quick-start, note that the Docker/database setup uses a root `.env` (see `docs/db/db-initialize.md`) and that `.env` is also loaded by the dev process in every mode. In `db-initialize.md`, note that the app dev process additionally loads `.env.dev.local` (per the README) and that a single root `.env` copied from `sample.env` satisfies all three consumers. No behaviour change — this is purely a cross-reference.

### Nits

#### N1 — Reciprocal ADR link convention not applied when ADR-0022 landed

- **Severity:** nit
- **Files:** [`docs/adr/0022-route-schema-validation-and-openapi.md`](../../adr/0022-route-schema-validation-and-openapi.md) lines 50–54; the missing back-links belong in [`docs/adr/0007-library-wrapper-seam.md`](../../adr/0007-library-wrapper-seam.md) Related (lines 60–67) and [`docs/adr/0009-environment-validation-gate.md`](../../adr/0009-environment-validation-gate.md) Related (lines 62–74)
- **Flagged by:** `documentation-and-adrs` (ADR lifecycle / cross-reference discipline)
- **Why it matters:** The project has an established reciprocal-link convention — `0008→0020`, `0009→0017`/`0021`, `0011→0017` all forward-link to the later ADR that extends or relaxes them, and `docs/adr/README.md` explicitly sanctions editing `Related` links in place (it is not a reasoning-body edit). ADR-0022 back-links to 0007 ("extends its use … to route shapes"), 0009 ("sibling value-validation surface … runtime-traffic counterpart"), 0008, and 0018, but none of those four forward-link to 0022 (confirmed: no ADR references `0022-route-schema`). The clean precedent `0008→0020` (a pure "extends" that *did* get a reciprocal forward link) shows the intended pattern; 0022's relationship to 0007 is the same shape. Consequence: a reader on 0007 (the wrapper seam) or 0009 cannot discover that 0022 extended them.
- **Suggested fix:** Add a forward `Related` link to 0022 in at least 0007 and 0009 (and optionally 0008/0018), naming the extension — mirroring how 0008 links to 0020. Reasoning bodies stay untouched.

#### N2 — parallel-script-execution.md overstates the risk of single-package `--parallel`

- **Severity:** nit
- **File:** [`docs/pnpm/parallel-script-execution.md`](../../pnpm/parallel-script-execution.md) line 39
- **Flagged by:** `code-review-and-quality` (accuracy) — corroborated by the in-repo research dossier
- **Why it matters:** The doc says "**This single-package use is undocumented; treat it as best-effort and do not rely on it for ordered CI workflows.**" The companion dossier [`docs/pnpm/pnpm-parallel-research.md`](../../pnpm/pnpm-parallel-research.md) (cross-reference rows at lines 323–324, and Suggested-doc-tightening item 2 at line 358) refutes "best-effort": single-package `--parallel` is upstream-intentional since PR #6785 (merged 2023-07), has a regression test, and lives in mainline unchanged through v11.5.x. It is undocumented *on pnpm.io* but not unsupported. The wording also conflates two separate concerns — single-package support vs. ordering.
- **Suggested fix:** Soften per dossier item 2: keep the "undocumented on pnpm.io" note, drop "best-effort," and state the real caveat plainly — as in a workspace, don't use `--parallel` when ordering matters. The existing per-major reverify tripwire (same line) is good hygiene and can stay.

#### N3 — Research dossier's cross-reference table is internally stale after "Applied" fixes

- **Severity:** nit
- **File:** [`docs/pnpm/pnpm-parallel-research.md`](../../pnpm/pnpm-parallel-research.md) line 320 (cross-reference row) vs. lines 3, 357, 359
- **Flagged by:** `code-review-and-quality` (internal consistency)
- **Why it matters:** The header (line 3) and Suggested-doc-tightening (lines 357, 359) state that items 1 and 3 have been applied to `parallel-script-execution.md`. But the cross-reference table (line 320) still quotes the *pre-fix* wording of that doc — "By itself, this runs the matched scripts sequentially in name order…" — and marks it "Refuted," as though it were the live text. The live doc now reads "with pnpm's default concurrency cap (`min(4, …)`) — concurrently, not one at a time" (line 29), so a reader comparing the table to the doc hits a contradiction. The dossier is an explicitly point-in-time snapshot, which softens this, but the header already amends item 1 while the table was left untouched.
- **Suggested fix:** Either annotate the line-320 row as "since corrected (item 1 applied)" or leave the table as the historical record and add a one-line pointer at the top of the cross-reference section noting that rows for applied items reflect the pre-fix wording. Minor; the point-in-time framing means this is not urgent.

### Info

#### I1 — Empty, untracked `docs/decisions/` directory

- **Severity:** info (not a change request)
- **Path:** `docs/decisions/` (directory)
- **Note:** The directory exists on disk but is empty and untracked (`git ls-files docs/decisions/` returns nothing). This project's ADRs live under `docs/adr/` (per `docs/adr/README.md` and `CONTEXT.md`); `docs/decisions/` is the default path the upstream `documentation-and-adrs` skill template suggests, so this is almost certainly a stray directory created by tooling rather than a second ADR home. It will not appear in the repo (untracked), so no action is required — flagged only so a future contributor doesn't mistake it for the canonical decisions folder.

#### I2 — pnpm research dossier genre and open items

- **Severity:** info
- **File:** [`docs/pnpm/pnpm-parallel-research.md`](../../pnpm/pnpm-parallel-research.md)
- **Note:** This is a citation-heavy, point-in-time research dossier (upstream pnpm PR numbers, commit SHA, contributor names, a research date). This is **not** a rename-test violation: the identifiers are stable external citations to pnpm's own repo, not references to this project's files/commits/contributors, and the doc is explicitly labeled a snapshot. Worth knowing: its "Suggested doc tightening" items 4 (`--no-bail` one-liner), 5 (mention `--sequential` in "Two reasons to skip"), 6 (`--reporter-hide-prefix`), and 7 (regex-flag rejection) remain unapplied to `parallel-script-execution.md` — all are small enhancements, none are defects.

## Strengths observed

- **ADR reciprocal-link discipline is exemplary where it counts.** `0009↔0017↔0021`, `0011↔0017`, and `0008↔0020` each name the superseded/extended facet on *both* sides and preserve the original reasoning body verbatim — exactly the partial-supersession mechanic `docs/adr/README.md` prescribes. ADR-0020 even states the lifecycle rationale inline (a reciprocal `Related` link is distinct from a reasoning-body edit).
- **Uniform ADR template adherence.** All 22 ADRs carry `Status` + `Date` and the full Context / Decision / Alternatives considered / Consequences / Related shape; every "Alternatives considered" entry states its rejection reason; every "Consequences" section splits positive from accepted-negative. This is the highest-value documentation the repo has and it is consistently strong.
- **Rename-test discipline is real, not aspirational.** Operational file paths are consistently labeled "operational hint" and marked movable (`README.md` repo-layout table, every plan's "Files currently in scope"), concepts are defined once in `CONTEXT.md` and referenced by anchor, and the docs describe rules/contracts rather than pasting current code.
- **`db-initialize.md` is a model operational runbook** — the three-consumer env bridge is explained precisely, commands are given per shell, and the "Common issues" section anticipates real failure modes (including the `curl.exe`-vs-`curl` PowerShell alias gotcha).
- **Precedence and reverify hygiene.** The testing and logging READMEs both state the "project doc wins over the upstream skill" precedence explicitly, and the testing README carries an actionable Vitest major-bump reverify checklist. `CONTEXT.md` enforces a single canonical definition per term with cross-links.

## Out of scope (leads for other-area reviewers)

- **Logging area** ([`../plans/logging.plan.md`](../plans/logging.plan.md)): W1 is a documentation fix (the helper itself is correct), but the logging reviewer may want to confirm that call sites route caught values through the centralized `normalizeError` helper and do not inline the `instanceof … : new Error(\`${x}\`)` pattern the README currently illustrates.
- **Configuration area** ([`../plans/configuration.plan.md`](../plans/configuration.plan.md)): W2 turns on how the env files are actually loaded (Vite `--mode dev` env-file precedence, the `.gitignore` allowlist that ignores both `.env` and `.env.dev.local`, and Docker Compose's `.env`-only auto-load). The configuration reviewer may want to verify the runtime behaviour matches whatever reconciling wording the two docs settle on.
- No code defects were surfaced within the documentation scope.
