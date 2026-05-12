# Code Review Findings: Documentation

## Summary

- Total findings: 8
- Blockers: 1
- Warnings: 2
- Nits: 3
- Info: 2

Overall verdict: The documentation set is small, focused, and disciplined. The review-plan + findings split is a strong convention: plans define conceptual scope with operational file hints (acceptable per the plan's own codebase-agnostic-but-operational clause), findings carry the area-specific verdict. Internal structure of each doc is clean — single clear purpose stated up-front, navigable headings, tables used appropriately for comparisons. The one merge-blocker is a set of three cross-reference paths in `docs/code-reviews/plans/README.md` that resolve outside the repo because they only step up two levels instead of three — every "Related project rules" link in that file is dead. Beyond that, the standalone pnpm parallel-execution guide contains a Node-version claim that does not match pnpm v11's actual minimum (Node 20.x, not 22+), and a CLI flag name (`--allow-new`) that should be verified against pnpm's own CLI reference before relying on it. The repository has no root `README.md`, no `docs/README.md`, no `CONTEXT.md`, and no ADRs — the plan acknowledges these as optional ("when present") but their absence is worth noting for a project that already has documented decisions worth preserving (port-claim handoff protocol, supply-chain trade-off accepting 0-day packages, vite-node runtime choice).

## Findings

### [blocker] Three "Related project rules" links in plans/README.md resolve outside the repository

**File:** `docs/code-reviews/plans/README.md:34-36`
**Skill / criterion:** Review focus → Cross-references / "Links to other docs use relative paths"; `code-review-and-quality` → Correctness; rename test (the link must resolve regardless of where the reader opens the doc from)

All three links use `../../.claude/rules/...`. From `docs/code-reviews/plans/README.md`, two `..` segments land in `docs/` (not the repo root). The targets sit at `<repo>/.claude/rules/...`, which requires three `..` segments. As written:

- `[../../.claude/rules/invocations/code-review.md](../../.claude/rules/invocations/code-review.md)` → resolves to `docs/.claude/rules/invocations/code-review.md` (does not exist).
- `[../../.claude/rules/code-comments.md](../../.claude/rules/code-comments.md)` → resolves to `docs/.claude/rules/code-comments.md` (does not exist).
- `[../../.claude/rules/invocations/doc-editing.md](../../.claude/rules/invocations/doc-editing.md)` → resolves to `docs/.claude/rules/invocations/doc-editing.md` (does not exist).

Every "Related project rules" link in the file is broken. A reader who clicks any of them hits a 404 in the GitHub web UI or a missing-file error in their editor — i.e., the rules the plans rely on become invisible to the reader the plans were designed to orient.

**Suggested fix:**

Change `../../` to `../../../` on each of the three links:

```markdown
## Related project rules

- [`.claude/rules/invocations/code-review.md`](../../../.claude/rules/invocations/code-review.md) — when to invoke `code-review-and-quality` and the trigger-to-skill mapping that informs each plan.
- [`.claude/rules/code-comments.md`](../../../.claude/rules/code-comments.md) — applies to inline comments and JSDoc during every review.
- [`.claude/rules/invocations/doc-editing.md`](../../../.claude/rules/invocations/doc-editing.md) — applies when the PR touches documentation.
```

A link checker (CI step or pre-commit) would have caught all three. The review-focus checklist already calls this out: "Broken links would have been caught by a link checker; if no link checker is configured, flag." Flagging now: there is no link checker. Adding `lychee`, `markdown-link-check`, or similar to CI is worth considering.

---

### [warning] Node-version claim about pnpm v11 is incorrect ("drops Node 18-21")

**File:** `docs/pnpm/parallel-script-execution.md:94-96` (the "Node 22 or newer required" subsection)
**Skill / criterion:** Review focus → Accuracy / "Claims about library/tool behaviour match the current version of that tool (pnpm v11 settings, Vite version, Node version, etc.)"

The doc states:

> pnpm v11 is pure ESM internally and drops Node 18-21. If your runtime is Node 22+, you're fine.

pnpm v11's actual minimum is Node 20.x (per pnpm's published install requirements). It drops Node 18 (and Node 19, which is already out of LTS), but Node 20 and Node 21 are supported. The doc's phrasing implies Node 22+ is mandatory, which is stricter than reality and could mislead a reader running Node 20 LTS into thinking they need to upgrade. The header itself ("Node 22 or newer required") is also wrong.

This does not affect this project (engines pins Node 24+), but the doc is generic guidance that may be consulted by readers on other projects.

**Suggested fix:**

```markdown
### Node 20 or newer required

pnpm v11 is pure ESM internally and drops Node 18 (and 19, already past EOL). If your runtime is Node 20 LTS or newer, you're fine. Verify against [pnpm's install docs](https://pnpm.io/installation) when bumping.
```

If the project deliberately wants to recommend Node 22+ (e.g., for unrelated reasons), name that separately rather than attributing it to a pnpm requirement.

---

### [warning] `--allow-new` flag name needs verification against pnpm's CLI reference

**File:** `docs/pnpm/parallel-script-execution.md:111-114`
**Skill / criterion:** Review focus → Accuracy / "External links resolve and point to the right version of upstream docs"; rename test (the example must still work for a reader who copies it)

The doc gives this example for overriding the `minimumReleaseAge` gate on a one-off install:

```sh
pnpm add some-package --allow-new
```

The flag's exact spelling has changed across pnpm release cycles (variants seen in the wild include `--allow-non-applicable-package`, `--allow-non-applicable-packages`, and `--ignore-minimum-release-age`). A reader copying the example risks pnpm rejecting an unknown flag. The pnpm v11 release notes / `pnpm add --help` output should be the source of truth, and the doc should mirror exactly what pnpm prints.

**Suggested fix:**

Verify against the installed pnpm:

```sh
pnpm add --help | rg -i 'release-age|allow-new|allow-non-applicable'
```

Update the example to the flag pnpm actually accepts, and link to the pnpm CLI page for the chosen subcommand:

```markdown
To override the gate on a one-off install, use the flag pnpm exposes for it (`pnpm add --help` lists the current name). Or lower the threshold globally in the config file.
```

This keeps the doc generic-but-actionable without pinning to a flag name that may rot.

---

### [nit] Repository has no root `README.md` to orient a cold reader

**File:** repo root
**Skill / criterion:** `documentation-and-adrs` → README Structure ("Every project should have a README that covers: one-paragraph description, quick start, commands, architecture"); review focus → Structure / "first paragraph orients a cold reader"

There is no `README.md` at the repository root. `CLAUDE.md` exists and routes a reader to `.claude/rules/`, but `CLAUDE.md` is agent-focused: it does not describe what the project is, how to run it, where the architecture lives, or how to contribute. A new human contributor cloning the repo has no entry point that explains "what is this" before they have to read `package.json` scripts and infer from there.

Per the project's own rule that documentation should describe concepts/conventions, a one-screen `README.md` is a small ask and would orient both humans and agents that don't load `CLAUDE.md` first.

**Suggested fix:**

Add a `README.md` at the repo root with the minimum:

```markdown
# <Project name>

One-paragraph description of what this is and who it's for.

## Quick start

1. Install dependencies: `pnpm install`
2. Start the dev server: `pnpm dev`

## Commands

| Command      | Description           |
| ------------ | --------------------- |
| `pnpm dev`   | Run the dev server    |
| (others)     | (when added)          |

## Architecture

Brief overview of the project's shape. Link to `docs/` for area-specific reviews and to `CLAUDE.md` for the project rules that govern contribution.
```

Keep it generic — no inlined file paths beyond the top-level directories — so the rename test holds.

---

### [nit] No `docs/` or `docs/code-reviews/` README to orient the reader

**File:** `docs/` (no README); `docs/code-reviews/` (no README)
**Skill / criterion:** Review focus → Structure / "Each doc has a single clear purpose stated up-front"; `doc-coauthoring` → readers need to know where they are

`docs/code-reviews/plans/README.md` orients a reader who is already inside the `plans/` folder, but there is no signpost at `docs/` or at `docs/code-reviews/` that explains:

- That `docs/code-reviews/` splits into `plans/` (the area templates) and `comments/` (the findings produced by running a plan)
- That `docs/pnpm/` and `docs/ts/` are topic-specific reference material, unrelated to the review workflow
- The intended audience for each folder

A reader who lands on `docs/` via GitHub's file browser has to open each folder to find out what's in it.

**Suggested fix:**

Add a short `docs/README.md`:

```markdown
# Docs

Reference material and process documentation for this project. Conceptual content only — code lives elsewhere.

| Folder            | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `code-reviews/`   | Area-specific review workflow: plans (templates) and findings (outputs) |
| `pnpm/`           | Standalone guides for pnpm features the project uses                 |
| `ts/`             | TypeScript reference material                                        |

When adding an ADR, place it under `docs/adr/`. When adding to the domain glossary, edit `CONTEXT.md` at the repo root.
```

And `docs/code-reviews/README.md`:

```markdown
# Code reviews

The review workflow has two halves:

- `plans/` — one template per area, describing what to look for. Run the plan that matches the PR's area.
- `comments/` — findings produced by running a plan. One findings file per area per review.

See `plans/README.md` for the area index.
```

Keep both codebase-agnostic — describe the convention, not which areas exist today (the area list belongs in `plans/README.md` where it can live alongside the actual plan files).

---

### [nit] Plan example uses a current-codebase identifier verbatim instead of an abstract pattern

**File:** `docs/code-reviews/plans/shared.review.md:51`
**Skill / criterion:** Review focus → Codebase-agnostic test; `.claude/rules/invocations/doc-editing.md` ("Do not paste literal code snippets from this repo as illustrations. Use minimal generic examples that show the pattern rather than excerpts from real modules")

The bullet reads:

> Helpers exported via a namespace object (`TimingHelper = { delay }`) match the project's convention; the namespace name mirrors the file name (`timing.helper.ts` → `TimingHelper`)

`TimingHelper` and `timing.helper.ts` are concrete artefacts in the current codebase. If those files are renamed or replaced, the bullet becomes a confusing example pointing at something that no longer exists. The rule the bullet is trying to express — *helper file name in kebab-case maps to a PascalCase namespace export of the same name* — is abstractable.

The other plans take more care here: `bootstrap.review.md` consistently says "the four helpers (close, listen, kill, shutdown-request)" without naming the variables they export; `configuration.review.md` describes settings by purpose rather than by current key.

**Suggested fix:**

Rewrite the bullet to show the pattern, not the instance:

```markdown
- Helpers exported via a namespace object (`<Concept>Helper = { fn1, fn2 }`) match the project's convention; the namespace name is the PascalCase form of the kebab-case file name (`<concept>.helper.ts` → `<Concept>Helper`).
```

Same edit applies if any other plan grows a similar concrete example.

---

### [info] No ADRs exist despite multiple decisions worth recording

**File:** `docs/adr/` (does not exist)
**Skill / criterion:** `documentation-and-adrs` → "When to write an ADR — choosing a framework, library, or major dependency; designing a data model; selecting an authentication strategy; any decision that would be expensive to reverse"; the area's own plan calls out ADR template adherence in the review focus

The findings produced by other area reviews surface at least three decisions that fit the ADR criteria from the skill:

1. **The port-claim handoff protocol** — cooperative-then-force shutdown via a dedicated HTTP route, with a timing-safe token check and a Windows-only force-kill fallback. This is a non-obvious architectural choice that future engineers will be tempted to simplify ("why not just kill -9?") without the trade-offs in front of them.
2. **`minimumReleaseAge: 0`** — the configuration review explicitly recommends recording the supply-chain trade-off as an ADR. The plan's own example ADR template ("ADR-001: Use PostgreSQL for primary database") matches this shape exactly.
3. **vite-node + Node 24 runtime, no production build step** — the configuration findings note this is a "coherent triangle (tsconfig + engines + runtime)" that future tsconfig changes need to respect. Worth a one-page ADR so the constraint survives someone "just switching to commonjs".

None of these are blockers — the project's small and the decisions are recent enough that the authors still remember why. The ADR cost is "10 minutes now"; the rationalisation rate from the skill is "a 10-minute ADR prevents a 2-hour debate about the same decision six months later."

**Suggested fix:** No code change requested. When the next decision lands, create `docs/adr/0001-<title>.md` following the template in the `documentation-and-adrs` skill. Backfill the three above in the same pass.

---

### [info] No `CONTEXT.md` glossary despite cross-doc vocabulary

**File:** `CONTEXT.md` (does not exist at repo root)
**Skill / criterion:** Review focus → Clarity / "Jargon is defined the first time it appears in the doc, or links to where it's defined (e.g. `CONTEXT.md`)"; `.claude/rules/invocations/grill-with-docs.md` ("The skill keeps `CONTEXT.md` and `docs/adr/` in sync with the conversation as decisions crystallise. Files are created lazily — only when there's something to write.")

Terms used across the plan + findings set without a single defined home:

- **"handoff" / "single-instance handoff" / "cooperative-then-force"** — the bootstrap area's central concept, defined ad-hoc in `bootstrap.review.md` and `bootstrap.findings.md`.
- **"port claim"** — used as a verb in multiple plans without being defined.
- **"primitive library"** — appears in `shared.findings.md` as a defence-of-pre-defined-constants framing; not defined elsewhere.
- **"wiring layer" / "composition layer"** — used interchangeably across server-composition docs.

Each doc reintroduces the term when it comes up. A single glossary entry per concept would shorten every plan that uses it and remove the risk of subtle drift (e.g., `wiring layer` and `composition layer` are probably the same thing, but neither plan says so explicitly).

**Suggested fix:** No action required today — the `grill-with-docs` rule explicitly says these files are created lazily, "only when there's something to write." Worth creating as soon as a second area review surfaces the same term needing definition for the third time.

---

## Strengths observed

- The plan / findings split is a strong, repeatable convention: plans describe conceptual scope with operationally-labelled file paths, findings carry the actual verdict with severity prefixes. The structure scales to new areas with minimal overhead.
- `parallel-script-execution.md` passes the rename test cleanly — the guidance is about pnpm features, not about how this codebase uses them; no project-specific file paths or identifiers appear in the prose.
- Tables are used appropriately throughout (regex-pattern shapes, monorepo flags, decision matrix, area index) rather than buried in prose.
- Every plan opens with a one-sentence scope definition before any file paths appear, so a reader who only reads the first paragraph still knows the area's concept. The codebase-agnostic-but-operational compromise is honoured.
- Findings files use consistent severity labels (`blocker` / `warning` / `nit` / `info`), include both a file pointer and a skill/criterion citation, and finish with a "Strengths observed" + "Out of scope" pair — making it easy for the next reviewer to see what was deliberately deferred.

## Out of scope

- The TS reference material under `docs/ts/` is a `.json` schema, not prose — formal-schema correctness belongs to the configuration review area.
- Several findings docs contain pasted code snippets from the repo as suggested fixes; whether that pattern should be tightened (per the strict reading of the doc-editing rule) is itself a documentation-process question that probably warrants a meta-ADR rather than per-file edits.
- Link-checker / pre-commit / CI hygiene to catch the broken cross-references mechanically is a configuration / tooling decision; the broken links themselves are documentation findings (above).
- The absence of a project-wide changelog (`CHANGELOG.md`) is worth noting once the project has shipped versions; not relevant pre-1.0.
