# Code Review Findings: Modules

Area plan: [`../plans/modules.plan.md`](../plans/modules.plan.md). Reviewed the module tier under `app/server/modules/**` — the `db`, `logger`, `openapi`, `shutdown`, and `startup` modules — for the structural and encapsulation properties common to every module: public surface, internal layout, helper-namespace conformance, cohesion, cross-module dependency hygiene, and rename-test naming. Domain correctness of each module is delegated to its own plan and is out of scope here.

Skills invoked: `code-review-and-quality` (multi-axis baseline), `improve-codebase-architecture` and `codebase-design` (module boundaries, depth, seam placement), with `fastify-best-practices` and `node` applied to the route-owning and process-touching modules and ADR-0003 / ADR-0008 / `CONTEXT.md` consulted as the canonical boundary definitions.

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 1     |
| Nit      | 2     |
| Info     | 2     |

**Verdict.** The module tier is in strong structural health. Every module exposes a curated frozen namespace through a single `index.ts` barrel, every external consumer imports through those barrels only (never into a subfolder), and there is no cross-module reach into internals and no import cycle — all module-qualified alias imports resolve to be same-module self-references forced by ADR-0003's single-`../` depth cap, not boundary violations. The `shutdown` module's exposure of `redactPaths` as a curated derived value consumed by the composition layer is a textbook application of the plan's "expose a curated value, don't leak the internal" rule. The one finding worth acting on is that `startup` under-exposes its public contract relative to its four sibling modules, forcing the composition layer to hand-restate the `claimPort` signature; the remaining items are minor layout/naming consistency points and two forward-looking observations.

## Findings

### Warning

#### W1 — `startup` does not export its `claimPort` function type, so the composition layer hand-restates the contract

- **Severity:** warning
- **Files:** [`app/server/modules/startup/index.ts`](../../../app/server/modules/startup/index.ts) line 1; consumed at [`app/server/helpers/app/app-start.helper.ts`](../../../app/server/helpers/app/app-start.helper.ts) lines 45–47
- **Flagged by:** `code-review-and-quality` (architecture / type boundaries), `codebase-design` (the interface is the surface callers depend on), modules plan — "Encapsulation boundary and public surface"
- **Why it matters.** The `startup` barrel exports only `StartupModule`, with no companion type for its public function. Every sibling module exports the signature type of what it exposes — `db` exports `SetupDbFunction`, `logger` exports `BuildLoggerFunction`, `openapi` exports `SetupDocsFunction` / `SetupValidationFunction`, `shutdown` exports `SetupShutdownFunction` — and the composition layer imports those types instead of restating them. Because `startup` omits its equivalent, [`app-start.helper.ts`](../../../app/server/helpers/app/app-start.helper.ts) hand-writes `claimPort: (instance: AppInstance) => Promise<void>` inline (lines 45–47). The module, not the consumer, should own the shape of its own surface; the current gap makes the consumer restate a contract it should merely reference, and breaks the otherwise-uniform sibling pattern. TypeScript's structural check of `startup: StartupModule` against the inline type at [`start.ts`](../../../app/server/start.ts) partially guards against an incompatible drift, so this is a surface-completeness and consistency problem rather than a runtime-safety one.
- **Suggested fix.** Add a `ClaimPortFunction` type in the startup module's `types/` area (e.g. a new `claim-port.type.ts`, mirroring how `db.type.ts` carries `SetupDbFunction`) and re-export it from the barrel, then consume it in the composition layer:

  ```ts
  // app/server/modules/startup/types/claim-port.type.ts
  import type { AppInstance } from "@server/types/instance.type";

  type ClaimPortFunction = (instance: AppInstance) => Promise<void>;

  export type { ClaimPortFunction };
  ```

  ```ts
  // app/server/modules/startup/index.ts
  export { StartupModule } from "./startup.module";
  export type { ClaimPortFunction } from "./types/claim-port.type";
  ```

  Then in `app-start.helper.ts`, replace the inline `claimPort: (instance: AppInstance) => Promise<void>` with `claimPort: ClaimPortFunction`.

### Nit

#### N1 — `shutdown` routes aggregator is a single-route pass-through

- **Severity:** nit
- **File:** [`app/server/modules/shutdown/routes/index.ts`](../../../app/server/modules/shutdown/routes/index.ts) lines 6–11
- **Flagged by:** `codebase-design` (deletion test; "one adapter = hypothetical seam, two = real"), `improve-codebase-architecture` (shallow indirection)
- **Why it matters.** The `routes` aggregator destructures `{ handle }` and forwards it straight to `shutdownRoute(fastify, { handle })`, reconstructing the same options object with no added composition. With exactly one internal route today, the layer is a shallow pass-through: applying the deletion test, removing it and registering `shutdownRoute` directly from [`shutdown.module.ts`](../../../app/server/modules/shutdown/shutdown.module.ts) (line 31) concentrates no complexity, because there is a single caller. It is a hypothetical seam, not yet a real one.
- **Suggested fix.** Optional and low-stakes. If the module is expected to grow additional internal routes, keep the aggregator as the growth seam and leave a one-line note that it fans out to multiple routes once they exist. If not, register `shutdownRoute` directly from the module and drop the intermediate `routes/` plugin, keeping the `routes/shutdown/` barrel. Either is defensible; the point is that the layer currently earns its keep only prospectively.

#### N2 — `kill.type.ts` groups a PID-lookup type under a kill-named file

- **Severity:** nit
- **File:** [`app/server/modules/startup/types/kill.type.ts`](../../../app/server/modules/startup/types/kill.type.ts) lines 10–12
- **Flagged by:** modules plan — "Naming" (capability-named, rename-test-safe); `code-review-and-quality` (readability)
- **Why it matters.** The file is named for the kill step but carries `PidLookupResult` alongside `KillPortOwnerResult` and `KillFailureReason`. `PidLookupResult` describes the PID-discovery substep, not the signal-sending step; a reader scanning `types/` for the lookup contract would not predict it lives in `kill.type.ts`. This is minor — the lookup is genuinely part of the kill flow and both types are module-internal — so it is a naming-cohesion nit, not a boundary issue.
- **Suggested fix.** Leave as-is if the kill flow is treated as one concept, or split `PidLookupResult` into a `pid-lookup.type.ts` (or rename the file to a broader `port-owner.type.ts`) if the lookup is expected to gain its own surface. Purely a legibility preference.

### Info

#### I1 — same-module deep references are textually indistinguishable from an illegal cross-module reach

- **Severity:** info
- **Files (examples):** [`app/server/modules/startup/helpers/claim-port/claim-port.helper.ts`](../../../app/server/modules/startup/helpers/claim-port/claim-port.helper.ts) lines 2–3; [`app/server/modules/shutdown/routes/shutdown/shutdown.route.ts`](../../../app/server/modules/shutdown/routes/shutdown/shutdown.route.ts) line 2
- **Flagged by:** `improve-codebase-architecture` (seam enforceability); ties to ADR-0008's accepted negative ("enforced by review, not tooling") and ADR-0003's depth-cap negative
- **Why it matters.** ADR-0003 caps relative imports at a single `../`, so a module file that reaches its own deeper-nested `constants/`, `types/`, or `routes/` must write the reference as the module-qualified alias `@server/modules/<self>/…`. That is exactly what the deeply-nested `startup` claim-port helpers and the `shutdown` route do — all confirmed same-module self-references, not violations. The consequence for reviewers: a legitimate self-reference (`startup` reaching `startup`'s constants) is byte-for-byte the same shape as the boundary violation the plan forbids (`logger` reaching `startup`'s constants). No lint rule can currently distinguish them, so the "reach a sibling only through its barrel" boundary rests entirely on reviewer attention. This is an observation about how the boundary is (not) mechanically enforced, not a defect in any module — nothing to change here.
- **For future consideration.** A lint rule that forbids a module-qualified alias (`@server/modules/X/…` for any subfolder) from resolving anywhere outside module `X` would give the boundary the mechanical teeth ADR-0008 notes it currently lacks. Surfaced again under Out of scope for a lint/tooling reviewer.

#### I2 — the aggregator-vs-helper line is drawn inconsistently across modules

- **Severity:** info
- **Files:** [`app/server/modules/db/db.module.ts`](../../../app/server/modules/db/db.module.ts) lines 9–19 vs [`app/server/modules/logger/logger.module.ts`](../../../app/server/modules/logger/logger.module.ts) + [`app/server/modules/logger/helpers/logger.helper.ts`](../../../app/server/modules/logger/helpers/logger.helper.ts)
- **Flagged by:** modules plan — "Internal layout" (the aggregator should not inline logic that belongs in an internal helper); `code-review-and-quality` (consistency)
- **Why it matters.** `logger` pushes its options-building into an internal `LoggerHelper` and keeps the aggregator thin; `db` inlines `createDbClient` directly in the aggregator and has no `helpers/` folder. Both are defensible — `db`'s inlined mapping is ~10 lines and private, and ADR-0008 explicitly accepts extra ceremony being skipped for thin capabilities — so this is a consistency observation, not a required change. It is noted only so a future reader knows the line ("inline vs extract") is currently a per-module judgement call rather than a fixed rule; if `db` grows a second internal concern, extracting `createDbClient` into a `db.helper.ts` would bring it in line with `logger`.
- **Suggested action.** None required. Extract only if `db`'s internals grow.

## Strengths observed

- **Barrel discipline is airtight from the outside.** Every external consumer — [`start.ts`](../../../app/server/start.ts), [`app-build.helper.ts`](../../../app/server/helpers/app/app-build.helper.ts), [`app-start.helper.ts`](../../../app/server/helpers/app/app-start.helper.ts), [`instance.type.ts`](../../../app/server/types/instance.type.ts), the health routes — imports each module at its root (`@server/modules/<name>`). A scan for external reaches into any module's `constants/` `helpers/` `types/` `routes/` returned only same-module files. The public/private boundary ADR-0008 promises is respected in practice.
- **Curated-value exposure done right.** `shutdown` exposes `redactPaths` (line 38 of [`shutdown.module.ts`](../../../app/server/modules/shutdown/shutdown.module.ts)), a derived list built internally from the shutdown-token header, and the composition layer feeds it to `logger.buildLogger(appEnv, [...redactPaths])`. The logger never learns how the shutdown module works, and the shutdown module never reaches into the logger — exactly the pattern the plan's "public surface" section prescribes.
- **No sideways coupling between `startup` and `shutdown`.** The cooperative-handover helper posts to the shutdown route using the *shared* server constants (`@server/constants/endpoints.constant`, `base-urls.constant`, `headers.constant`) that both modules reference, rather than reaching into the sibling module. There is no cross-module barrel import between any two modules and therefore no import cycle.
- **Uniform helper-namespace conformance.** Every module aggregator and every internal helper (`LoggerHelper`, `CloseWithGraceHelper`, `HotReloadHelper`, `ArmHelper`, `AuthorizeHelper`, `TokenHelper`, `ClaimPortHelper`, `KillHelper`, `ListenHelper`, `CooperativeShutdownHelper`) is a single `Object.freeze({ … } as const)` PascalCase namespace, one per file, with no loose or default exports — ADR-0008's helper convention applied without exception, including for module-internal helpers behind the barrel.
- **Internal types stay internal.** Barrels re-export only the public surface; implementation types (`ShutdownContext`, `ShutdownHandler`, `ShutdownRouteOptions`, `KillPortOwnerResult`, `KillFailureReason`, `PidLookupResult`) are reachable only by sibling files within their module.
- **Discriminated-union result types for internal control flow.** The port-claim internals model outcomes as `KillPortOwnerResult` / `PidLookupResult` discriminated unions rather than throwing or returning bare booleans, giving the aggregator a clean internal seam to branch on ([`kill.helper.ts`](../../../app/server/modules/startup/helpers/claim-port/helpers/kill.helper.ts), [`kill.type.ts`](../../../app/server/modules/startup/types/kill.type.ts)).

## Out of scope

Cross-area leads surfaced for the reviewers who own them — not investigated here:

- **Shutdown-route authorization correctness** (loopback-host guard, `timingSafeEqual` token comparison, single-shot arming) in [`authorize.helper.ts`](../../../app/server/modules/shutdown/routes/shutdown/helpers/authorize.helper.ts), [`token.helper.ts`](../../../app/server/modules/shutdown/routes/shutdown/helpers/token.helper.ts), and [`arm.helper.ts`](../../../app/server/modules/shutdown/routes/shutdown/helpers/arm.helper.ts) → the shutdown domain plan and `security-and-hardening`. This plan checked only that these live correctly inside the module boundary, not whether the guard is sound.
- **Route registration and Fastify plugin lifecycle** — the `routes/` aggregator shape, prefix handling, and `onClose` hook wiring in [`shutdown.module.ts`](../../../app/server/modules/shutdown/shutdown.module.ts) → [`server.plan.md`](../plans/server.plan.md) and `fastify-best-practices`.
- **Process-touching correctness** — `process.kill` / `process.pid` / `process.ppid` handling and `AbortSignal.timeout` usage in the `startup` claim-port helpers → the startup domain plan and `node`.
- **Logging conventions at the module call sites** — emoji prefixes, `normalizeError` usage, level choices in the module log calls → [`logging.plan.md`](../plans/logging.plan.md) and `docs/logging/README.md`.
- **Spec-side conformance** — whether the module helpers' co-located specs honour the stateless-dispatcher contract and the `TEST_DATA` shape → [`testing.plan.md`](../plans/testing.plan.md) and [`helpers.plan.md`](../plans/helpers.plan.md).
- **A lint rule to enforce the module boundary mechanically** (see I1) — a rule that a `@server/modules/X/<subfolder>` alias may only be imported from within module `X` → a lint/tooling reviewer, relevant to ADR-0003 and ADR-0008.
</content>
</invoke>
