# 0012. Lint stance: the assertion ban and the SonarJS/security stack

- **Status:** Accepted
- **Date:** 2026-06-16

## Context

A single ESLint flat config is the project's only static-analysis and formatting gate. Two pressures shape how that gate is composed, and both come down to the same instinct: keep the unsafe operations rare, visible, and reviewable rather than ambient.

The first pressure is type assertions. An assertion tells the compiler to trust the author instead of proving the type; scattered through a tree they are silent lies that look like ordinary expressions, cannot be grepped for, and multiply once one papers over a mismatch. Yet a few casts are genuinely unavoidable — standard-library signatures wider than the runtime guarantees (key/entry enumeration), or test fixtures that deliberately stand in for a shape they do not fully satisfy.

The second pressure is composing the config itself. Recommended rule sets ship sensible defaults that are not all correct here: one leaves object-index access unguarded, one flags filesystem-path use this server makes legitimately, and two different sets each ship an unused-variables rule. The rest of the architecture commits to named exports (the frozen-namespace helper convention and the curated module barrel), so a default export is a hole in that discipline — but the tools that drive the build and the checks load their own config by reading a default export, so a blanket ban would break the gate that enforces it. Finally, splitting formatting from quality into a second tool is the common default, but at this size it buys a second config and a class of formatter-versus-linter conflicts.

## Decision

One flat config owns quality, security, and formatting, tuned so that every unsafe operation is funnelled to a single reviewable seam.

**Assertions are banned to a single seam.** The assertion-consistency rule runs at its strictest setting (no assertion style permitted), forbidding both the postfix `value as Type` and the prefix `<Type>value` forms everywhere. Const-assertions are a distinct, sound mechanism for deriving literal types and stay allowed; the ban targets assertions that override the inferred type, not those that narrow a literal. The one sanctioned unverifiable cast is a single generic helper — conceptually `cast<T>(value: unknown): T` — packaged in the frozen-namespace helper convention. Its defining file is the lone place granted a per-file opt-out from the rule; the cast lives inside that helper and nowhere else. Narrowing therefore defaults to type guards the compiler can follow, and every residual cast in the tree is one named, greppable call.

**Four recommended sets stack in a fixed order, then per-rule tuning closes the overlaps and gaps.** The config extends, in order, the core JavaScript set, the TypeScript set, the SonarJS set, and the security set; later sets layer on earlier ones, so the order is load-bearing. On top: the object-injection security rule is escalated to an error (index access from untrusted keys is a defect, not a warning); the non-literal-filesystem-path security rule is turned off (this server reads paths only from validated configuration, and the rule fires on every legitimate use); and the SonarJS unused-variables rule is disabled in favour of the type-aware TypeScript one, which understands the project's underscore-prefix ignore convention — running both would double-report. Test specs get a narrow relaxation: the rest-parameter-idiom rule and the SonarJS rule requiring an assertion in every test are both off there, because spec helpers and arrange-only tests legitimately violate them.

**Default exports are banned in source and required in config.** One rule forbids direct default exports across the codebase, pairing with the named-export conventions so every exported value has exactly one canonical name. A file-glob override inverts the rule for config files, where a default export is required because tool loaders read it. This is a deliberate named-only-for-source / default-required-for-config split, expressed as one rule plus one override rather than scattered per-file disables.

**No separate formatter ships; ESLint carries the stylistic conventions.** Formatting rules live in the same config as the quality rules: mandatory blank-line padding between statement groups, braces required on every control-flow block, and a ban on nested ternaries. One tool, one config, one command gate both formatting and quality.

## Alternatives considered

- **Allow assertions where the checker would otherwise complain (`as-needed`).** The setting a future engineer reaches for under friction. Rejected: it re-admits ambient, ungreppable inline assertions — the exact cost the ban exists to remove. The value of the ban is that there is _no_ inline assertion anywhere, so review attention stays finite and focused.
- **Ban assertions outright with no escape hatch.** Rejected: some casts are genuinely unavoidable, and with no sanctioned outlet authors would disable the rule inline at scattered sites — recreating the scatter problem with worse ergonomics.
- **Per-call rule-disable comments at each cast site.** Rejected: this spreads the opt-out across the tree, which is exactly as hard to audit as the assertions themselves, and the directives rot when the surrounding code moves.
- **A typed assertion-function (`asserts value is T`) instead of a returning cast.** Reads as sound but performs no runtime check here; it would need the same opt-out and adds throw-on-failure control flow the call sites do not want. Rejected as more machinery for the same unverifiable operation — the plain returning helper is the minimal seam.
- **Extend the recommended sets verbatim, no per-rule tuning.** Rejected: it leaves object-injection at warning strength, leaves the filesystem-path rule firing on every legitimate read, and double-reports unused variables. The defaults are a starting point, not the destination.
- **Ban default exports everywhere with no override.** Rejected: the tools that load config by reading a default export — linter, bundler, test runner, dead-code checker — would all break. The override is what makes the ban survivable.
- **Allow default exports everywhere.** Rejected: it reopens the hole the namespace and module conventions close, letting the same value be imported under inconsistent names and weakening the single-canonical-name property.
- **Add a dedicated formatter alongside ESLint.** Rejected at the current size: a second tool and config, plus a formatter and linter that both have opinions about blank lines and braces, conflict. One tool owning both keeps the gate single and conflict-free. This is the alternative most likely to be revisited as the codebase grows.

## Consequences

Positive:

- **One greppable seam per unsafe operation.** Every unsound cast is a single named call, audited via one helper file and one search term; every overridden naming rule is one declared opt-out. Reviewers stop hunting inline `as` and stray default exports across diffs.
- **Guards become the path of least resistance.** With inline assertions unavailable, the cheapest way to narrow a value is a type guard, keeping the checks the compiler actually follows.
- **Broad coverage with a low noise floor.** The recommended sets supply reach while the per-rule tuning removes the false positives, so a clean run means something. Security posture is explicit at the rule level: the genuinely dangerous pattern is an error, the false-positive-prone one is documented as off rather than silently ignored.
- **The naming conventions are enforced at lint time.** The default-export ban reinforces the helper and module conventions, while the config-file override keeps the tooling that enforces them working.
- **One tool, one command.** Quality and formatting share a single gate with no formatter-versus-linter conflict class to manage.

Accepted negatives:

- **The cast helper is still unsound.** Its cast is unverifiable by definition; a wrong type argument compiles and fails at runtime. The ban concentrates that risk, it does not remove it — reviewers must scrutinise each call's type argument.
- **Two privileged files.** The cast helper's file holds the assertion opt-out and config files hold the inverted default-export rule. Both need heightened review, and the opt-outs must stay scoped — widening either silently re-opens the door.
- **Friction is the point and can feel like an obstacle.** An author blocked from `as`, or from a source-level default export, must write a guard, route through the helper, or rename the export. A future engineer hitting this repeatedly might relax the rule; this record exists so that choice is made deliberately, against the reasoning above, not by reflex.
- **Implicit knowledge in the stack.** The fixed extend-order and the per-rule opt-outs are not self-announcing — re-ordering the sets or dropping an override can silently change behaviour, and the no-formatter posture has to be known rather than discovered. Carrying formatting in the linter also means style violations surface as lint errors and the fix step must be run to reshape code, rather than auto-shaping on save.

## Related

- [`./0002-typescript-compiler-stance.md`](./0002-typescript-compiler-stance.md) — the strictness compiler flags; the assertion ban is the lint-side complement to that type-system-side stance.
- [`./0003-path-alias-scheme.md`](./0003-path-alias-scheme.md) — owns the alias depth cap and the import-sort grouping; those rules live in the same config but are not decided here.
- [`./0004-pnpm-dependency-stance.md`](./0004-pnpm-dependency-stance.md) — the install-time supply-chain gates this static-analysis stance sits beside as a sibling control surface.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — a sibling lint rule that funnels a different unsafe operation (raw custom-issue codes) through one sanctioned call, the same one-reviewable-seam shape.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the frozen-namespace helper convention the cast helper is packaged under and the curated module surface the default-export ban protects.
- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the validation gate that relies on the assertion ban and single sanctioned cast this stance owns.
- [`./0010-logging-and-error-handling.md`](./0010-logging-and-error-handling.md) — the logger type surface that relies on the assertion ban ruling out per-call-site casts.
- [`../../.claude/rules/code-comments.md`](../../.claude/rules/code-comments.md) — the comment and JSDoc conventions reviewed alongside lint output.
- [`../../.claude/rules/invocations/code-review.md`](../../.claude/rules/invocations/code-review.md) — review rule pairing `typescript-magician` with cross-cutting review when assertions or `any` removal appear in a diff.
