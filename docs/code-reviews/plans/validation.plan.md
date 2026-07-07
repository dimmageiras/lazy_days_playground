# Code Review Plan: Value Validation

## Scope

The **value-validation surface** — the schema-driven layer that parses untrusted or external values into typed, branded outputs, plus the machinery that reports validation failures. The defining property: this layer turns unknown input into a value the rest of the codebase can trust, and it owns how a validation failure is shaped and surfaced. It is a cross-cutting concern, not a module: the reusable parts live under the shared tree, the parts that depend on a specific runtime live with that runtime, and one bootstrap site invokes the surface to gate process startup.

Sub-areas:

- **Validation library wrapper** — the single seam through which the project reaches the schema library, where library-wide configuration is pinned so every schema inherits it.
- **Schemas** — the declarative shapes that parse inputs into typed, branded outputs, including the per-field error messages a failure reports.
- **Issue-code vocabulary** — the frozen constant enumerating the library's issue codes and the type derived from it, shared so both the schema side and the failure-formatting side name codes the same way.
- **Failure formatting and custom issues** — the runtime-side helpers that turn raw validation issues into a stable, reportable shape and that attach project-specific custom issues.
- **Startup gate** — the bootstrap invocation that validates the environment surface against a schema and aborts the process on failure, before any framework instance exists.
- **Route schemas** — the per-route declarative shapes that validate request and response payloads at the framework edge, authored through the same wrapper seam, and that double as the source of the generated API description. The seam that binds these schemas to the framework's validator and serialiser compilers, and the development-only exposure of the generated document, are the runtime-side wiring this sub-area covers.

## Files currently in scope

These globs are **operational hints** — see the plans-index [`README.md`](./README.md#conventions) and [`CONTEXT.md`](../../../CONTEXT.md#operational-hint) for the canonical statement. The conceptual scope above is canonical and survives a reorganisation.

- `app/shared/wrappers/zod.wrapper.ts` (the library seam — re-exports and library-wide config)
- `app/shared/schemas/**` (declarative schemas with branded outputs and per-field messages)
- `app/shared/constants/zod.constant.ts` (the frozen issue-code vocabulary)
- `app/server/helpers/zod-server.helper.ts` and its spec (failure formatting, custom-issue attachment)
- `app/server/helpers/app/env-var.helper.ts` and its spec (the env-validation entry the bootstrap calls)
- `app/server/types/zod.type.ts` (the issue-code union, custom-issue context, formatted-issue shape)
- the bootstrap validation call site in `app/server/helpers/app/app-start.helper.ts` (invocation and fail-fast handling only — broader bootstrap discipline stays with the server plan)
- `app/server/routes/**/schemas/**` (per-route request/response schemas, co-located with the route they describe)
- `app/server/modules/openapi/**` (the seam binding route schemas to the framework's validator/serialiser compilers and the development-only docs surface — the module's shape and encapsulation are the modules plan's concern; the validation contract is reviewed here)

## Required skills

| Skill                     | Why                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `code-review-and-quality` | Multi-axis baseline                                                                                                             |
| `zod`                     | Schema composition, `safeParse` vs `parse`, transforms and pipes, branded types, custom issues, error-shaping, v4 issue surface |
| `typescript-magician`     | Branded output types, the issue-code union derived from a frozen record, mapped-type key derivation, `as const` discipline      |
| `vitest`                  | The runtime-side validation helpers each ship a matching spec, reviewed under the project testing conventions in tandem         |

## Review focus

### Library wrapper as the only seam

- The project reaches the schema library through the wrapper, not by importing the library directly at schema sites. The wrapper is where library-wide configuration is set once so every schema inherits it.
- Library-wide configuration that exists for a runtime constraint (for example, disabling a compilation mode that would violate a content-security policy) carries a comment explaining the constraint — this is a non-obvious WHY that a future reader would otherwise undo. Flag the removal of such configuration that isn't paired with removal of the constraint that motivated it.
- The wrapper re-exports the narrow set of builders the project actually uses, named consistently. A new schema reaching past the wrapper to the raw library is a finding — it bypasses the configuration seam.

### Schema discipline

- Schemas use the safe, non-throwing parse path at their call sites; a validation failure is a value to branch on, not an exception to catch for control flow. A bare throwing parse in normal control flow is a finding.
- Parsed outputs that represent a distinct domain value are branded so a raw primitive cannot be passed where a validated value is expected.
- Coercion from a string input to another primitive is explicit (a transform feeding a piped target schema), and the target schema re-validates the coerced value rather than trusting the transform. The order matters: validate the source type, transform, then validate the target type.
- Per-field error messages are present, are sentences in the project's message style (capitalised, no trailing period, present tense), and distinguish the "missing" case from the "wrong type" case where both are reachable.
- A schema describes a shape, not a consumer. Its name and field names describe the value being validated, not the module that happens to validate there.

### Route schema validation and the generated API surface

- A route that accepts or returns a structured payload declares its shape as a schema authored through the wrapper. A route reaching past the wrapper to the raw library, or hand-writing the framework's native schema format inline, is a finding — it bypasses the configuration seam and splits the validation vocabulary.
- The same schema is both the runtime validator and the source of the route's documentation fragment. A second, hand-maintained description of the same shape is a finding: the two drift the moment one side changes.
- Runtime validation is installed unconditionally; only the human-facing documentation surface is gated to development. A change that gates validation itself on the runtime, or that mounts the documentation surface in a non-development environment, is a finding — validation is a correctness and security boundary, not a dev affordance.
- A response schema describes the success shape the route actually returns — neither looser than the handler (a field the handler always returns is not optional in the schema) nor tighter (the handler must not return a field the serialiser would strip).
- Per-field descriptions and examples on a route schema follow the project's message style, and the schema name describes the payload, not the route that happens to use it (the rename test applies).
- The seam module's structural properties — its curated surface, barrel, and internal layout — are the modules plan's concern; this plan covers only that the route's validation contract is correct and routed through the wrapper.

### Issue-code vocabulary

- The issue-code constant is frozen with `Object.freeze({...} as const)` and its keys derive from the library's own issue-code union (a mapped type), so a library version that adds or removes a code surfaces as a type error rather than drifting silently.
- The exported type is the union of the constant's values, derived from the constant — not a hand-maintained second list that can fall out of sync.
- Both the schema side and the formatting side name codes through this single constant; a string literal issue code spelled inline at either site is a finding.

### Failure formatting and custom issues

- The formatter produces a stable, serialisable shape (path, message, code) from the raw issues, and reports **every** issue rather than only the first — a contributor fixing a fresh checkout needs the full set in one run.
- A custom issue carries its project-specific code through the documented custom-issue channel (the params surface), and the formatter reads it back through a guard, falling back to the raw code when the value isn't a recognised project code. The guard is a real runtime check, not a cast.
- The path is rendered through the library's own path-to-string utility, not a hand-rolled join, so nested and indexed paths format consistently.

### Startup gate (invocation only)

- Validation of the environment surface runs **first** — before any framework instance is constructed — and a failure exits the process with a non-zero code rather than letting startup proceed in a half-configured state. (The surrounding bootstrap discipline — instance construction order, the listen/cleanup path — is the server plan's concern; this plan covers only that validation is invoked first and fails the process.)
- The failure path surfaces the formatted set of offending variables, not just a generic "invalid env" message — the formatter's full-set guarantee is the point of routing through it.
- The values the bootstrap consumes from the environment flow from the validated, branded output, not re-read as raw unvalidated primitives after the gate. A raw re-read downstream defeats the gate.

### TypeScript discipline

- The branded output types are the only contract the rest of the codebase sees for a validated value; consumers accept the brand, not the underlying primitive.
- The issue-code union and the custom-issue context are typed once and imported; they are not re-declared per consumer.
- No `any`. `unknown` is acceptable at the raw-issue boundary, narrowed by a guard before use. Type-only imports use `import type`.

### Spec coverage expectations

- Each runtime-side validation helper ships a matching `*.spec.ts` next to it.
- Specs follow the project testing conventions (worker model, `TEST_DATA` shape, context-local `expect`, assertion style) — see [`./testing.plan.md`](./testing.plan.md) for the full criteria; flag deviations here too.
- The cases that must be covered: a passing input, a failing input that exercises the full-set reporting, the custom-issue round-trip (custom code in, recognised code out), and the fallback when an unrecognised code arrives.

### Codebase-agnostic naming

- Schema and helper names describe the value or the validation concern, not the call site. The rename test (see [`CONTEXT.md`](../../../CONTEXT.md#rename-test)) applies: a name that encodes its current caller rots when the caller moves.

## When to run this plan

A PR that:

- Adds or changes a schema under `app/shared/schemas/**`, or changes a schema's branded output or its per-field messages.
- Changes the library wrapper — the re-exported surface or the library-wide configuration.
- Adds or changes the issue-code vocabulary or the types derived from it.
- Changes the failure-formatting helper, the custom-issue channel, or their specs.
- Changes how the bootstrap invokes environment validation or how it handles a validation failure.
- Bumps the schema library's major version (the issue-code surface and the custom-issue channel are the likely break points).
- Adds or changes a route's request/response schema, or changes how a route declares its shape.
- Changes the seam that binds route schemas to the framework's validator/serialiser compilers, or the gating that keeps the documentation surface development-only.

## Related

- [`./shared.plan.md`](./shared.plan.md) — the broader shared-utilities rules; the wrapper, schemas, and issue-code constant live under the shared tree, but their validation-specific criteria are delegated here.
- [`./helpers.plan.md`](./helpers.plan.md) — the namespace and purity rules the runtime-side validation helpers also satisfy; this plan sharpens the validation-specific criteria on top.
- [`./server.plan.md`](./server.plan.md) — the bootstrap discipline that surrounds the startup gate; that plan delegates the schema/wrapper layer and the validation invocation here.
- [`../../adr/0009-environment-validation-gate.md`](../../adr/0009-environment-validation-gate.md) — the decision to validate the environment against a schema at startup and fail fast, which the startup-gate criteria enforce.
- [`../../adr/0022-route-schema-validation-and-openapi.md`](../../adr/0022-route-schema-validation-and-openapi.md) — the decision that one route schema validates traffic and generates the API description, with the documentation surface development-only, which the route-schema criteria enforce.
- [`./modules.plan.md`](./modules.plan.md) — the structural and encapsulation review of the schema-binding module; this plan delegates the module's shape there and keeps only the route validation contract.

## Output

Apply the standard review delivery: if reviewing a GitHub PR, post findings via the `gh` CLI (see the code-review project rule).
