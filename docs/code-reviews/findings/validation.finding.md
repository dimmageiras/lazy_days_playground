# Validation — Review Findings

Reviewed against [`../plans/validation.plan.md`](../plans/validation.plan.md).
Skills invoked: `code-review-and-quality`, `zod`, `typescript-magician`, `vitest`
(plus the project testing conventions in [`../../testing/README.md`](../../testing/README.md)
and ADR-0009 / ADR-0022).

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 1     |
| Nit      | 2     |
| Info     | 2     |

The value-validation surface is in excellent shape and closely obeys the plan and
its governing ADRs. The library seam holds (only the wrapper imports `zod` /
`zod/v4/core`, grep-verified); every schema uses the non-throwing parse with the
single named throw isolated at the env helper; all env outputs are uniformly
branded; the issue-code constant derives its keys from the library's own union so
a version bump surfaces as a type error; the formatter reports every issue,
round-trips custom codes through a real runtime guard, and renders paths through
the library's own utility; the startup gate validates first, exits non-zero, and
surfaces the full formatted set; and route schemas are authored through the wrapper
with one schema serving both validation and docs, validation unconditional and docs
dev-only. `pnpm typecheck` (`tsc -b`) is clean and the 78 validation-scoped tests
(47 shared + 31 server, across 6 spec files) pass. The one warning is a
route-validation-contract gap on the control-plane shutdown route, which returns a
structured payload with no response schema. The nits and info are minor
consistency / robustness / forward-looking notes.

## Findings

### Warning

#### W1 — Shutdown route returns a structured payload with no response schema

- **Severity:** warning
- **File:** [`app/server/modules/shutdown/routes/shutdown/shutdown.route.ts`](../../../app/server/modules/shutdown/routes/shutdown/shutdown.route.ts) — lines 22–41 (the `instance.post` options carry no `schema`; the `reply.send({ accepted, timestamp })` payloads at 29–32 and 37–40)
- **Criterion:** route-schema sub-area — "A route that accepts or returns a structured payload declares its shape as a schema authored through the wrapper" / ADR-0022 "request and response validation is installed in every environment — it is a guarantee, not a dev affordance."
- **Why it matters:** The route returns the same structured JSON shape (`{ accepted: boolean, timestamp: string }`) on both the authorized (202) and unauthorized (401) paths, but registers no `schema.response`. Three consequences follow: (1) the response is not serialiser-validated against a schema — it is emitted through Fastify's default serialisation, so nothing catches the shape drifting from what a consumer expects; (2) it contributes no OpenAPI fragment even in development, so the control-plane contract has no single source of truth alongside the health routes that do; (3) the response contract lives only in the handler literal, so a consumer or test that hard-codes `{ accepted, timestamp }` can silently diverge from it. Runtime risk today is low because the handler returns object literals that are correct by construction, and there is a plausible deliberate reading (an internal control-plane route intentionally kept off the documented surface per ADR-0018). But the plan's rule is unconditional and does not carve out control-plane routes, and ADR-0022 frames response validation as a guarantee installed everywhere. The request side needs nothing here — authorisation is header-based (`isAuthorizedShutdownRequest` reads the `SHUTDOWN_TOKEN` header, not a body), so only the response side is affected.
- **Fix:** Declare a `shutdownResponseSchema` through the wrapper, co-located with the route under a `schemas/` folder, and attach it to both status codes — e.g.

  ```ts
  const shutdownResponseSchema = zObject({
    accepted: zBoolean(),
    timestamp: zIsoDateTime(),
  });

  instance.post(
    `/${SHUTDOWN}`,
    {
      schema: {
        response: {
          [ACCEPTED]: { content: { "application/json": { schema: shutdownResponseSchema } } },
          [UNAUTHORIZED]: { content: { "application/json": { schema: shutdownResponseSchema } } },
        },
      } satisfies OpenApiSchema,
    },
    (request, reply) => { /* … */ },
  );
  ```

  (`zBoolean` would need adding to the wrapper's re-exports.) Alternatively, if the exemption is deliberate, record it — an ADR note or a comment at the route — so a future reviewer does not read the omission as an oversight.

### Nit

#### N1 — Route operation `description` carries a trailing period; per-field descriptions do not

- **Severity:** nit
- **Files:** [`app/server/routes/api/health/db/db.route.ts`](../../../app/server/routes/api/health/db/db.route.ts) lines 29–30; [`app/server/routes/api/health/server/server.route.ts`](../../../app/server/routes/api/health/server/server.route.ts) lines 25–26
- **Criterion:** schema message-style — "Per-field descriptions … follow the project's message style (capitalised, no trailing period …)".
- **Why it matters:** Within the same schema files the two registers disagree: the per-field `.meta({ description })` strings ("Database branch the server is connected to", "ISO 8601 timestamp of when the check ran") correctly omit the trailing period and match the env-message style, while the operation-level `description` ("Confirms the database connection and returns the connected branch with an ISO timestamp.") ends with one. (The operation `summary` fields — "Check database health status" / "Check server health status" — correctly have no trailing period; an earlier draft also flagged `summary`, which was wrong.) The per-field rule is satisfied; this is purely the internal inconsistency of the operation `description`. Stylistic — not blocking, and a defensible choice if operation descriptions are treated as prose sentences.
- **Fix:** Pick one convention for the operation-level `description` and apply it across the health routes — either drop the trailing period to match the per-field style, or accept full-sentence punctuation there and note it as the intended split.

#### N2 — `getFormattedZodIssues` renders an empty path segment for a root-level issue

- **Severity:** nit
- **File:** [`app/server/helpers/zod-server.helper.ts`](../../../app/server/helpers/zod-server.helper.ts) lines 51 & 55–58
- **Criterion:** failure-formatting — "The formatter produces a stable, serialisable shape (path, message, code) …"; code-review-and-quality (edge cases).
- **Why it matters:** For an issue whose `path` is empty (a root-level refine / a whole-object failure), `zToDotPath([])` returns `""`, so `getFormattedZodIssues` yields `path: ""` and `getFormattedZodIssueLines` renders the visually broken line `- : <message>`. This is currently unreachable through the only production caller (`validateEnv`, whose every issue is keyed by a top-level `VITE_APP_*` field), but both helpers are general-purpose and exported for arbitrary schemas, so a future object-level refine would surface the empty segment. Low priority given no current call path hits it.
- **Fix:** When the path is empty, substitute a stable sentinel (e.g. `"(root)"`) in the line renderer, or document that callers must only pass field-keyed issues. Illustrative:

  ```ts
  const path = zToDotPath(issue.path) || "(root)";
  ```

### Info

#### I1 — `config({ jitless: true })` is a global module-load side-effect, protected only by the seam

- **Severity:** info (no change requested)
- **File:** [`app/shared/wrappers/zod.wrapper.ts`](../../../app/shared/wrappers/zod.wrapper.ts) lines 16–17
- **Criterion:** library-wrapper sub-area — library-wide configuration pinned once in the seam, with a comment for the non-obvious CSP WHY.
- **Note:** This is done correctly — `config({ jitless: true })` is set once in the wrapper and the comment explains the CSP / `unsafe-eval` constraint, which is exactly the non-obvious WHY the plan wants preserved. The forward-looking caveat for future maintainers: the guarantee rests entirely on the seam discipline — because `config()` mutates Zod's global config, if any module ever imports `zod` directly and builds a schema before this wrapper is first imported, that schema would compile without `jitless`. The seam currently holds (grep confirms only this file imports `zod` / `zod/v4/core`), so there is nothing to change; this is a note to keep the seam intact rather than a finding.

#### I2 — Health routes declare only the 200 response shape

- **Severity:** info (no change requested)
- **Files:** [`app/server/routes/api/health/db/db.route.ts`](../../../app/server/routes/api/health/db/db.route.ts), [`app/server/routes/api/health/server/server.route.ts`](../../../app/server/routes/api/health/server/server.route.ts)
- **Note:** Both routes schematise only the `OK` response. The DB health route can fail (`ensureConnected` may throw → 500), and neither route declares an error-response shape. The plan's response-schema criterion is about the *success* shape matching the handler, which both satisfy exactly, so this is not a finding — just an observation that the generated document describes only the happy path. If a documented error contract is later wanted, it would be an additive `response[INTERNAL_SERVER_ERROR]` entry.

## Strengths observed

- **The seam is airtight.** Only [`zod.wrapper.ts`](../../../app/shared/wrappers/zod.wrapper.ts) imports `zod` and `zod/v4/core` (grep-verified across `app/**`); every schema, helper, route schema, and the issue-code constant reaches the library exclusively through the `z`-prefixed re-exports. No schema hand-writes the framework's native validation format inline.
- **`jitless` config with its WHY.** The CSP / `unsafe-eval` constraint behind `config({ jitless: true })` is captured in a comment — the kind of non-obvious WHY the plan flags for protection.
- **Safe parse everywhere; single named throw.** No throwing `.parse(` exists anywhere in `app/**` (grep-verified); the schema and its call sites use `safeParse`, and `validateEnv` is the only place that converts a failure into a thrown, name-tagged `Error` detected via a name-based guard — exactly the ADR-0009 split.
- **Correct v4 idioms.** `zStringbool` (not `z.coerce.boolean()`) avoids the `"false"` → `true` coercion trap; the unified `error` parameter is used throughout (no removed `required_error` / `invalid_type_error`); string→number coercion is staged `regex → transform(Number) → pipe(zNumber().int().min().max())`, validating source, transforming, then re-validating the target.
- **Uniform, distinct branding.** Every env field brands its output; `portSchemaFor<Brand>()` mints distinct `DbPort` vs `Port` brands, and the type test asserts they are not interchangeable. Brand types derive once from the schema's inferred output ([`app-env.type.ts`](../../../app/shared/types/app-env.type.ts)).
- **Drift-proof issue-code vocabulary.** [`zod.constant.ts`](../../../app/shared/constants/zod.constant.ts) freezes the constant with a mapped type keyed off `ZodIssue["code"]` (`Uppercase<Code>`), so adding/removing a library code is a compile error; the `IssueCodes` union is derived from the constant's values, not hand-maintained; both the schema/formatter sides name codes only through this constant (no inline issue-code string literal exists outside the definition, grep-verified).
- **Report-all formatter with a real guard.** `getFormattedZodIssues` maps *every* issue to a stable `{ message, path, validationCode }`, reads the custom code back through `isIssueCode` (a genuine `isString` + Immutable-`Set` membership check, not a cast), falls back to the raw code when unrecognised, and renders the path through the library's own `toDotPath`.
- **Startup gate obeys ADR-0009.** [`app-start.helper.ts`](../../../app/server/helpers/app/app-start.helper.ts) validates before any instance is built, exits non-zero on failure, logs the full formatted set through the fallback logger, and passes the branded `validatedEnv` onward — no raw re-read downstream.
- **Secret-safe failure output.** The failure lines carry only `path` + static `message`; no input value is echoed and `reportInput` is never enabled, so a bad `VITE_APP_DB_PASSWORD` / `VITE_APP_SHUTDOWN_TOKEN` cannot leak its value into logs.
- **Route schemas do double duty correctly.** Health response schemas are authored through the wrapper, match their handler outputs exactly (neither looser nor tighter), and the openapi module installs validation unconditionally while gating only the docs surface on `isDevelopment` — both paths covered by [`openapi.module.spec.ts`](../../../app/server/modules/openapi/openapi.module.spec.ts).
- **Specs conform and cover the required set.** All four validation specs follow the project conventions (synchronous `VitestSetup()` destructure, `trackLeaksInSpec`, frozen `TEST_DATA` with function-getters rest-spread out and data-getters retained, context-local `expect`, specific matchers) and cover the mandated cases: passing input, full-set aggregation (`should aggregate one issue per failing field rather than short-circuit`), the custom-issue round-trip, and the unrecognised-code fallback.

## Out of scope

- **Shutdown module structure/encapsulation.** W1 addresses only the route's *validation contract*. The shutdown module's curated surface, barrel, and internal layout ([`app/server/modules/shutdown/**`](../../../app/server/modules/shutdown)) belong to the modules / server plans — flagged here so that reviewer sees the missing response-schema lead.
- **OpenAPI module shape & dependency pinning.** The openapi module's barrel and curated surface, and the exact-pin/release-age treatment of `fastify-zod-openapi`, `@fastify/swagger`, `@fastify/swagger-ui` (ADR-0004), are the modules / dependency plans' concern; here only the validation contract routed through it was reviewed.
- **Bootstrap lifecycle beyond the gate.** Instance construction order, the listen/claim-port path, and the graceful-shutdown wiring in [`app-start.helper.ts`](../../../app/server/helpers/app/app-start.helper.ts) are the server plan's concern; this review covered only that validation runs first and fails the process.
- **`AppEnv` camelCase projection and ambient `ImportMetaEnv` typing.** The derived `AppEnv` mapped type and the ambient input-type declaration for the bundler env object (ADR-0009's "two honest faces") sit in the shared/server typing surface; the branded outputs were verified here, but the projection adapter and ambient declaration were not traced.
