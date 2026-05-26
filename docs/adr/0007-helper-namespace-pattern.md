# 0007. Helper namespace export pattern

- **Status:** Proposed
- **Date:** 2026-05-26

## Context

Small utility modules — string helpers, date helpers, predicate helpers, test-infrastructure dispatchers — accumulate quickly in any codebase, and the way they are exported shapes how every consumer imports them, how the IDE renames them, how the bundler tree-shakes them, and how a reviewer can tell whether a helper file is still doing one thing. JavaScript and TypeScript give several plausible shapes for "a small file with a few related functions" — loose named exports, a default-exported object, a class with static methods, a barrel that re-exports everything from a folder — and each shape rots differently as the codebase grows.

The project already settles the question in practice: every helper file under both the application-side shared helpers tree and the test-infrastructure helpers tree exports one frozen namespace object whose entries are the helper functions. An ESLint rule already forbids direct default exports in the same scope. Recording the decision as an ADR makes the convention explicit so a future contributor adding a helper file does not pick a different shape and a reviewer does not have to re-derive the rationale from existing files.

## Decision

Every helper module exports **one frozen namespace object** named after the concept the file groups, in the form:

```ts
const ExampleHelper = Object.freeze({
  someFunction,
  otherFunction,
} as const);

export { ExampleHelper };
```

Conventions:

- The namespace name is the PascalCase form of the kebab-case file name (`example.helper.ts` → `ExampleHelper`).
- The object literal is frozen at runtime via `Object.freeze` and narrowed at the type level via `as const`.
- Only the namespace is exported; the individual functions remain module-internal.
- No default exports anywhere — an ESLint rule enforces this.

Loose function exports, default exports, class-statics shapes, and barrel-only re-exports are rejected for helper modules.

## Alternatives considered

### Loose named exports — `export const someFunction = …`

Each helper exports its functions individually; consumers `import { someFunction } from "…"`. Rejected because it loses the concept boundary at the call site — `someFunction(x)` reads identically whether it came from the string helper, the date helper, or a module-local utility, and the import line is the only signal a reviewer has. The namespace form puts the concept back on the call site (`ExampleHelper.someFunction(x)`), which is the readability gain the pattern exists for.

### Default-exported object — `export default { someFunction, otherFunction }`

A single default export carrying the namespace. Rejected on rename-safety and tooling grounds: default exports rename freely at each import site (every importer picks its own local name), defeating the convention that the namespace name is derived from the file name; the IDE's rename-symbol operation has nothing stable to anchor on. The ESLint rule that forbids direct default exports also rules this out at the linter level.

### Class with static methods — `class ExampleHelper { static someFunction() {…} }`

A class whose static methods carry the helpers. Rejected on two counts: the project's TypeScript posture restricts emit-bearing class syntax (the `erasableSyntaxOnly` flag), and a class-statics shape implies an instance contract the helpers never have. The frozen-object shape expresses the same "namespace of functions" idea without the class baggage.

### Barrel-only re-exports — one folder with a single `index.ts` re-exporting loose functions

A barrel that re-exports loose function names from sibling files. Rejected because it stacks two failure modes — the loose-export shape's call-site ambiguity above, plus a barrel that tree-shakers handle inconsistently and that forces every cross-module rename to cascade through the barrel. The namespace pattern obtains the "one import per concept" property without needing a barrel.

### Mixed exports — namespace plus loose functions from the same file

The namespace object plus the individual functions exported alongside it for "direct" use. Rejected because it gives two equivalent ways to reach the same function and invites cross-file drift on which one is canonical. One canonical export per concept is the rule; the namespace is that canonical export.

## Consequences

- **One import per concept.** A consumer that needs three functions from the same helper writes one import (`import { ExampleHelper } from "…"`) and destructures locally — `import` lines stay readable as the file grows.
- **Rename safety is a function of file naming.** The namespace identifier is derived from the file name, so a folder-wide rename of a helper file mechanically implies the namespace rename; the IDE's rename-symbol operation has a stable anchor at every import site.
- **Tree-shaking remains effective.** A bundler can drop unused entries from the frozen object because the entries are statically named in the literal; the freeze is a runtime no-op for the bundler's static-analysis pass.
- **The call site carries the concept.** `ExampleHelper.someFunction(x)` reads with one extra token compared to `someFunction(x)`, but the extra token is the concept boundary, which is the reviewability win the pattern is for.
- **The ESLint rule and the convention agree.** Direct default exports are forbidden by an ESLint rule (with a carve-out for files that need them by their toolchain, e.g. configs and ambient declaration files); the convention is enforced at the linter level rather than left to reviewer vigilance.
- **The pattern extends to test-infrastructure helpers.** The same shape is used in the test-infrastructure helpers tree, with one additional contract from the runner ADR — every helper is a *stateless dispatcher*, holding no state at module scope. The namespace pattern does not by itself enforce statelessness; the runner contract does.
- **Adding a helper is mechanical.** A new helper file adds one function to its namespace and (when the file is new) one frozen-object declaration; there is no separate barrel or index to update, and no "should this be its own export" question to relitigate per helper.

## Related

- [ADR-0002](./0002-test-runner-contract.md) — the stateless-dispatcher contract that test-infrastructure helpers follow on top of this pattern.
- [`../code-reviews/plans/helpers.plan.md`](../code-reviews/plans/helpers.plan.md), [`../code-reviews/plans/shared.plan.md`](../code-reviews/plans/shared.plan.md) — review criteria that enforce the namespace pattern on application-side and shared-utility helpers.
- [`../code-reviews/plans/test-infra.plan.md`](../code-reviews/plans/test-infra.plan.md) — review criteria that enforce the namespace pattern on test-infrastructure helpers.
