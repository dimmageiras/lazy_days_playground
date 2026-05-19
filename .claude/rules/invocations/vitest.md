# Invoke `vitest`

Invoke the `vitest` skill when working on any test file (`*.spec.ts`, `*.spec.tsx`, or equivalent) or on the project's Vitest infrastructure — config, setup, mocks, helpers, scope wrappers.

## Triggers

- Writing a new spec or modifying an existing one.
- Importing from `vitest` or `@vitest/*`.
- Touching the Vitest config, the shared setup file, or the cross-spec mock surface.
- Adding or changing a scope helper, test-app factory, or pollution probe used by specs.
- Reviewing test code (own changes, another agent's output, or a PR's spec changes).

## Pair with the project's testing documentation

The `vitest` skill is the upstream Vitest reference. The project's own testing conventions (file layout, `TEST_DATA` structure, mock strategy, assertion style, concurrency rules, naming grammar) live in [`docs/testing/README.md`](../../../docs/testing/README.md). **Read it first.** It captures decisions the upstream skill cannot know about.

Where the upstream skill and the project doc diverge, the **project doc wins**. The upstream skill teaches the API surface; the project doc teaches how this codebase uses it.

## Boundaries with other skills

- **Cross-cutting code review** → also invoke `code-review-and-quality` per [`./code-review.md`](./code-review.md).
- **Editing the testing documentation itself** → also invoke the `doc-editing` rule ([`./doc-editing.md`](./doc-editing.md)).
- **Bug in a test or test infrastructure** → also invoke `diagnose`.
