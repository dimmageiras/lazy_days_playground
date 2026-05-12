# Code Review Plan: Documentation

## Scope

The project's prose: markdown files under `docs/**`, the domain glossary (`CONTEXT.md`), architectural decision records (`docs/adr/**`), README files, and any other `*.md` checked into the repo. The defining property: it describes **concepts, decisions, and conventions**, not the current state of specific files.

Documentation has a different review bar than code. A bug in code shows up as a failing test or runtime error; a bug in docs shows up as an engineer (or agent) acting on outdated information without realising it. The review focuses on **accuracy that survives a refactor** and **clarity for a reader without the author's context**.

## Files currently in scope

- `docs/**/*.md` (operational docs, plans, guides)
- `docs/adr/**/*.md` (architectural decision records, when present)
- `CONTEXT.md` at repo root (domain glossary, when present)
- Every `README.md` (root and any nested ones)

## Required skills

| Skill | Why |
| --- | --- |
| `code-review-and-quality` | Multi-axis baseline (clarity, correctness of claims, completeness) |
| `doc-coauthoring` | The structured review of prose: context-gathering, structure, reader testing |
| `documentation-and-adrs` | Decides whether claims belong in inline comments, README, an ADR, or here; checks ADR template adherence and the lifecycle of superseded decisions |

## Review focus

### Codebase-agnostic test
Apply the **rename test**: if every file in the repo were renamed and reorganised tomorrow, would this doc still read correctly? If no, the doc is over-coupled to current implementation.

- No literal code snippets pasted from this repo as illustrations — use minimal generic examples that show the pattern
- No specific function names, file paths, component names, or variable identifiers referenced as load-bearing parts of the prose
- No commit hashes, branch names, PR numbers, or contributor names embedded in the doc body
- ADRs are the **one exception** for naming a system or component — they record the *decision* about it; even there, focus on the decision and alternatives, not the current code

### Accuracy
- Claims about library/tool behaviour match the current version of that tool (pnpm v11 settings, Vite version, Node version, etc.)
- External links resolve and point to the right version of upstream docs
- Code examples in docs compile and run as written (or are clearly marked as pseudo-code)
- Numbers (defaults, timeouts, status codes) match what's actually defined in the codebase or upstream spec

### Structure
- Each doc has a single clear purpose stated up-front
- The first paragraph tells a reader without context whether they need to keep reading
- Headings form a navigable outline; nested headings respect a single concept per level
- Tables vs. prose vs. lists: tables for comparisons, lists for steps, prose for nuance

### Clarity
- A reader can answer "what does this doc want me to do?" within the first screen
- Jargon is defined the first time it appears in the doc, or links to where it's defined (e.g. `CONTEXT.md`)
- Examples illustrate the *rule*, not the *current implementation* — examples that show "what we did" instead of "what to do" are a refactor away from being wrong

### ADRs specifically
- Status field is current (`Proposed`, `Accepted`, `Superseded by ADR-N`, `Deprecated`)
- Old ADRs are **not deleted** when superseded — they record historical reasoning
- Each ADR has: context, decision, alternatives considered (with rejection reasons), consequences
- The decision is something a future engineer/agent might reasonably want to undo; trivial decisions don't need ADRs

### Cross-references
- Links to other docs use relative paths, not absolute URLs (so they survive a repo move)
- Links to project rules (`.claude/rules/**`) are kept if the rule is invoked by the doc
- Broken links would have been caught by a link checker; if no link checker is configured, flag

### Reader testing
When reviewing a substantial doc change, run the `doc-coauthoring` reader-testing step: paste the doc into a fresh context and ask the questions that a real reader would ask. Issues that reader-testing exposes:
- Knowledge assumptions that aren't met
- Ambiguities that read fine to the author but mislead the reader
- Missing context that the author has but didn't transfer

### Codebase-agnostic *but* operational
The rename test is strict, but **operational documents** (like the plans in this folder) need to reference *where* to look in the current codebase to do their job. The acceptable compromise:
- The conceptual definition of the area/scope/topic is canonical and survives refactor
- Current file paths appear as **operational hints** — labelled as such, marked as movable
- A reader who knows the codebase reads the doc; a reader who doesn't still understands the concept

### Inline code comments and JSDoc
Inline comments are reviewed under a lighter rule (the project's `code-comments.md` rule). They don't fall under this plan, but a PR that touches docs *and* adds comments should be reviewed under both.

## When to run this plan

A PR that:
- Adds or modifies any `*.md` under `docs/**`
- Adds or supersedes an ADR
- Updates a README (root or nested)
- Modifies `CONTEXT.md`
- Introduces a new docs subdirectory (review the structure decision, not just the content)

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule). Doc reviews often warrant top-level review comments rather than inline anchors — prose feedback rarely maps to a single line.
