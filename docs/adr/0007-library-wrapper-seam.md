# 0007. Library wrapper seam: the jitless zod shim and the issue-code system

- **Status:** Accepted
- **Date:** 2026-06-16

## Context

The project depends on a third-party validation library for its schemas, and two forces push that dependency behind a project-owned seam rather than letting every module import it raw.

First, the library ships a JIT path that compiles validators at runtime with `eval` / `new Function`. A Content-Security-Policy without `unsafe-eval` blocks that path, so JIT has to be switched off once, globally, before the first schema is built. A library-global setting like this cannot live with one caller: applied lazily or only by some import sites, the unsafe path stays reachable from every site that skipped it, and the violation surfaces only at runtime in a policy-enforcing browser — the build passes and the schema still validates.

Second, validation produces issues whose category several parts of the server need to name: schemas that raise their own issues, the formatter that serialises issues into an error message, and tests that assert on a category. The library owns the set of built-in issue codes and changes it between versions. Bare string literals scattered across call sites give no signal on that drift, collapse every project-specific failure onto the library's single generic escape-hatch code, and read that escape hatch back as opaquely-typed parameters that only a runtime check — not the compiler — can vouch for.

Both forces want the same thing: a single owned place where the library is configured, narrowed, and given a project vocabulary.

## Decision

The validation library is reached only through a project-owned **wrapper shim** — a single module that re-exports the symbols the codebase is allowed to use — and the issue-code vocabulary is named through a single **frozen constant derived from the library's own code union**. Application code imports from these seams, never from the library directly. The stance has four facets.

**The wrapper runs library-global configuration as a one-time import side effect.** It executes the jitless config statement at module top level, so the first import applies the setting before any exported builder can be called. Because every schema is built from a wrapper-exported builder, and every builder lives behind that side effect, "config has run" is a precondition of "a builder exists to call" — the two cannot be ordered wrong. This keeps the library off the `eval` / `new Function` path a strict CSP forbids, with no per-call-site discipline.

**The wrapper re-exports a narrow, renamed surface as flat named exports.** Only the builders, the issue type, and the path renderer actually used are re-exported, under project-local names, alongside the type aliases the codebase needs. It does **not** bundle them into a frozen namespace object — that is the deliberate line between a wrapper and a helper (see [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md)): a helper groups the project's own stateless functions under one frozen namespace; a wrapper is a thin re-export over someone else's library and keeps the flat shape so the symbols read like the library's own. Widening the surface, pinning a version quirk, or swapping the library is then a single-file change.

**The issue-code vocabulary lives in one frozen constant whose annotation is derived from the library.** Its keys are the upper-cased code names; its values are the library's own code strings. The type annotation is a mapped type over the library's issue-code union, keyed by each member upper-cased, so the hand-maintained value list must stay congruent with the library's current codes or the compiler rejects the constant — a version that adds, removes, or renames a code surfaces as a located build error rather than silent drift. The exported union type is derived from the constant's *values*, so the runtime object and the static union can never disagree. Every side — schemas, formatter, tests — names a code only through this constant; no bare code-string literals.

**Project-specific failures ride the library's generic code through one sanctioned helper, and are read back through a runtime guard.** The helper fills in the generic code and places the typed project category in the issue's parameters; a custom lint rule flags any inline call that sets the generic code directly, keeping the carried category typed as the union rather than an arbitrary string. The formatter reads the category back through a real runtime guard backed by a set of the constant's values: for an issue on the generic code it prefers the carried category when the guard recognises it, and falls back to the raw library code otherwise. The guard is not redundant with the write-side typing — the library types the carried parameters opaquely on read, so deserialisation is an untyped read only the guard can vouch for. The formatter reports **every** issue, producing a stable serialisable shape per issue (dotted path via the library's own path renderer, human message, resolved category); a companion view renders the same issues as newline-joined lines for an error message.

## Alternatives considered

- **Import the library directly everywhere.** Rejected: no choke point for the global config and no guarantee it runs before the first schema is built, so any new direct import silently reintroduces the JIT / `eval` path the CSP forbids, and a surface narrowing or library swap becomes a repo-wide edit.
- **Apply the global config at application startup instead of at import.** Rejected: schemas are built at module-evaluation time, which can run before an explicit startup hook, reopening the ordering hazard the import side effect closes.
- **Keep `unsafe-eval` in the CSP so the JIT path is allowed.** Rejected: relaxing a security boundary for the whole application to keep one library's runtime convenience inverts the trade-off; disabling JIT in the one place that owns the library is the smaller, contained cost.
- **Wrap the library in a frozen namespace, like helpers do.** Rejected: it blurs the wrapper-vs-helper distinction the codebase keeps deliberate, adds a layer of member-access indirection at a pure re-export seam for no benefit, and invites treating a third-party surface as project-owned utility code.
- **Bare string literals for issue codes at each call site.** Rejected: nothing detects library drift, the vocabulary has no single owner, and a typo or removed code degrades silently to a non-match.
- **A hand-written enum or constant unrelated to the library's union.** Rejected: a parallel list the compiler never reconciles against the library rots exactly when the library version moves — the one moment a signal is most needed.
- **A code-generation step that emits the constant from the library's types.** Rejected as disproportionate: the mapped-type annotation gives the same drift guarantee with no build step, no generated artefact to keep in sync, and no toolchain to own.
- **Distinct first-class codes for each project failure instead of the custom round-trip.** Rejected: the library does not let consumers extend its built-in code set, so riding the generic code and carrying the category in parameters is the library-sanctioned path.
- **Trusting the carried category by its static type, skipping the runtime guard.** Rejected: the library types the carried parameters opaquely on read, so the write-side guarantee does not survive serialisation; reading without a guard is unchecked trust of external-shaped data.
- **Reporting only the first issue.** Rejected: a single validation pass can fail on several fields at once, and surfacing one at a time forces a fix-and-retry loop instead of showing every problem in one message.
- **Convention alone — a documented "always use the helper" rule with no lint.** Rejected: an unenforced convention drifts back to inline calls the first time someone is in a hurry, and the inline call is precisely what untypes the carried category.

## Consequences

**Positive**

- The global library setting runs exactly once, before any schema is built, because it rides the wrapper's import side effect and every builder lives behind it; the application stays compatible with a strict CSP (no `unsafe-eval`) without per-call-site discipline.
- The third-party surface is narrowed and renamed at one seam; widening it, pinning a version quirk, or swapping the library is a single-file change. The flat-named-export shape keeps the wrapper-vs-helper distinction legible: flat exports signal "re-export of someone else's library," a frozen namespace signals "the project's own helper."
- A library upgrade that changes the code set is caught at compile time in one file, turning silent runtime drift into a loud, located build failure; the runtime object and the static union are provably in sync because one derives from the other.
- Project-specific failures are distinguishable in formatted output while remaining valid library issues, and the carried category is typed at every authoring site. The formatter's output is stable, serialisable, reports all failures at once, and renders consistent dotted paths via the library's own renderer.
- The lint rule makes the typed helper the path of least resistance, so the custom round-trip stays honest without relying on reviewer vigilance.

**Accepted negatives**

- Disabling JIT gives up the library's fast compiled path; validation runs on the slower interpreted path — an accepted trade for CSP compatibility, since correctness and the security boundary outrank validation throughput here.
- The wrapper convention only holds while everyone imports through it. A direct library import re-opens the JIT / `eval` exposure and is invisible at build time, so it must be caught in review or by a lint rule that bans the raw import outside the wrapper; and deleting the config line "for performance" silently reintroduces the CSP risk, so the line carries a comment explaining why it exists.
- The constant's value list is maintained by hand; the mapped-type annotation guarantees it cannot be *wrong* relative to the library, but a new library code still requires a human to add the entry (the compiler says exactly when and what).
- The custom round-trip is indirection a reader must know — a project category hides under the generic code in the parameters rather than appearing as a top-level code — and the read-back guard duplicates at runtime a guarantee the write side already enforces statically, an accepted cost of the library typing the carried parameters opaquely on read.
- The custom-issue lint rule is a syntactic selector pair (one per way the generic code can be spelled in source); it is coupled to that surface and must be revisited if the authoring shape changes.

## Related

- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the frozen-namespace helper convention this wrapper deliberately does **not** follow; together they define the wrapper-vs-helper boundary.
- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the environment schema is built from the wrapper's re-exported builders (inheriting the jitless guarantee) and its branded outputs, and the validation gate's error message consumes this formatter.
- [`./0010-logging-and-error-handling.md`](./0010-logging-and-error-handling.md) — sibling error-normalisation concern that shapes failures for output.
- [`./0012-lint-stance.md`](./0012-lint-stance.md) — the broader lint configuration; this ADR owns only the single rule that forces custom issues through the typed helper.
- [`./0013-client-state-lanes.md`](./0013-client-state-lanes.md) — client-state libraries are likewise reached only through a wrapper, the same indirection convention applied to a different library.
- [`../../CONTEXT.md`](../../CONTEXT.md) — domain glossary, including **Load-bearing decision** and **Rename test**.
