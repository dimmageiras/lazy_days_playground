# Code Review Findings: Server

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 1     |
| Nit      | 3     |
| Info     | 2     |

Skills invoked: `code-review-and-quality` (baseline), `fastify-best-practices`, `node`, `typescript-magician`.

**Verdict.** The server slice is in good shape and matches the plan's intent closely, even though the bootstrap has since been refactored out of `start.ts` into `app/server/helpers/app/*` (the conceptual scope, not the glob, is what governs — the bootstrap discipline is reviewed where it now lives). Startup discipline is solid: environment validation runs first and exits `1` on failure, instance construction precedes registration precedes the port-claim ("listen"), and every failure path closes the instance and flushes the logger before a non-zero exit. There is exactly one typed instance alias with all five generic slots named (logger and type-provider included), and no route re-parameterises the provider. `pnpm typecheck` (`tsc -b`) is green. No blockers. The one warning is a latent guardrail gap in the server tsconfig's `lib` choice; the nits are `as const`/naming/constant-shape polish. Everything flagged is safe to merge behind, none of it blocks.

## Findings

### Warnings

#### W1 — `DOM` / `DOM.Iterable` in the server-only tsconfig expose browser globals to Node code

- **File:** `tsconfig.server.json:9` (`"lib": ["ESNext", "DOM", "DOM.Iterable"]`)
- **Flagged by:** `node` / `code-review-and-quality` — the plan's TypeScript-discipline focus ("the `lib`/`target`/`types` choices that govern what the server code can reach into").
- **Why it matters:** This config compiles only `app/server/**`, which runs in Node under type stripping. Pulling in the `DOM` libs makes `window`, `document`, `navigator`, `HTMLElement`, and the DOM-typed `fetch`/`Response` signatures visible to server code. Any of those would type-check cleanly and then throw `ReferenceError` at runtime — the exact guardrail the server `lib` set exists to provide. Server source is clean today (a grep for `document`/`window`/`fetch` in `app/server/**` finds only `new URL(...)`, which is a Node global from `@types/node`, not DOM), so this is a latent footgun rather than an active bug: it removes the compile-time wall that would otherwise stop a contributor from reaching for a browser API in Node.
- **Suggested fix:** Scope the `DOM` libs out of the server target so browser globals stop resolving in server code:
  ```jsonc
  "lib": ["ESNext"],
  ```
  Verify before committing — the `vite/client` types in `"types"` reference some DOM types in their own declarations, so re-run `pnpm typecheck` after the change. If `vite/client` genuinely requires `DOM` to compile, keep it but record why in a comment on the `lib` line, so the widening reads as deliberate rather than accidental. (Note: `tsconfig.shared.json` also carries `DOM` — that one is defensible because shared code runs in the browser too; this finding is about the server-only target.)

### Nits

#### N1 — Explicit `Readonly<Record<Signals, Signals>>` annotation discards the `as const` literal narrowing

- **File:** `app/server/constants/signals.constant.ts:3`
- **Flagged by:** `typescript-magician` / the plan's constants focus ("runtime freeze plus literal-type narrowing").
- **Why it matters:** The variable annotation `SIGNALS: Readonly<Record<Signals, Signals>>` overrides the type produced by `as const`, so `SIGNALS.SIGTERM` widens to the whole `Signals` union instead of the literal `"SIGTERM"`. Downstream (`const { SIGTERM } = SIGNALS` in `claim-port.helper.ts`) then carries the union type where the literal would be more precise. The annotation does buy one thing — `Record<Signals, Signals>` forces every `Signals` key to be present, an exhaustiveness guard if `close-with-grace` adds a signal — but it pays for it by throwing away the literal types.
- **Suggested fix:** Move the constraint to a `satisfies` clause, which keeps both the literal narrowing and the completeness check:
  ```ts
  const SIGNALS = Object.freeze({
    SIGABRT: "SIGABRT",
    // …
    SIGUSR2: "SIGUSR2",
  } as const satisfies Record<Signals, Signals>);
  ```

#### N2 — `LOOPBACK_HOSTS` is a derived constant expressed as a getter that rebuilds the Set on every read

- **File:** `app/server/constants/hosts.constant.ts:5-11`
- **Flagged by:** `code-review-and-quality` (constant shape) — the plan's "every server constants object is frozen with `Object.freeze({...} as const)`".
- **Why it matters:** `LOOPBACK_HOSTS` is a `get`ter that allocates a fresh `immutable.Set` on each property access. The sole consumer (`authorize.helper.ts:12`) destructures it once at module load, so there is no repeated allocation in practice today — but the shape is a footgun: any future consumer that reads `HOSTS.LOOPBACK_HOSTS` in a loop or per-request silently pays a new `Set` allocation each time, and a getter is an unusual way to express a frozen derived constant (`as const` adds nothing over a getter).
- **Suggested fix:** Compute the frozen Set once as a plain value rather than a getter, e.g. derive it above the object and reference it, so the constant is allocated exactly once and reads are free:
  ```ts
  const LOOPBACK_HOST_V4 = "127.0.0.1";
  const LOOPBACK_HOSTS = Set<string>([LOOPBACK_HOST_V4, "::1", `::ffff:${LOOPBACK_HOST_V4}`]);

  const HOSTS = Object.freeze({ LOOPBACK_HOST_V4, LOOPBACK_HOSTS } as const);
  ```

#### N3 — `ZOD` constant group is named for the library, not the concept

- **File:** `app/server/constants/zod.constant.ts:1`
- **Flagged by:** the plan's naming focus + `CONTEXT.md` rename test ("naming follows the protocol/concept of the constant, not the consumer").
- **Why it matters:** The group `ZOD` holds a single member, `ENV_VALIDATION_ERROR_NAME`, which is a project sentinel string set on a plain `Error.name` — it has nothing to do with Zod's API surface. Naming the group after the validation library ties it to a current implementation detail: if the schema library is swapped, the name rots even though the sentinel it holds would not change. The rename test fails.
- **Suggested fix:** Rename the group (and file) to describe the concept — e.g. `ENV_VALIDATION` / `env-validation.constant.ts`, or fold the sentinel into a broader validation-error constant — so the name survives a library change.

### Info

#### I1 — A build-time failure is logged twice, at two levels, through two loggers

- **File:** `app/server/helpers/app/app-build.helper.ts:79-94` and `app/server/helpers/app/app-start.helper.ts:82-114`
- **Why it's here (not a change request):** When `build` throws, it first logs the failure via `instance.log.error(…, "💥 Failed to build the app")` and closes its own instance. Because the assignment `instance = await build(...)` never completes, `instance` is still `undefined` in `app-start`'s `catch`, so `app-start` builds a *fresh* fallback logger and logs the same underlying failure again at `fatal` ("💥 Failed to start the server"). The net effect on a build failure is two log lines, at two levels, one of them pretty-printed in dev and one raw. This is defensible as a layered "detailed error where it happens, fatal at the boundary" pattern (the same shape appears on the `claimPort` path, where `claim-port.helper.ts` logs `error` then `app-start` logs `fatal`), and cleanup is correct (no double-close, since `build` already closed and `app-start` sees `undefined`). Flagged only so the duplication is a known, intentional choice rather than a surprise.

#### I2 — The failure-cleanup path is split across two try blocks with duplicated close-and-log logic

- **File:** `app/server/helpers/app/app-build.helper.ts:64-95`, `app/server/helpers/app/app-start.helper.ts:82-114`
- **Why it's here (not a change request):** The plan frames the ideal as "the try block wraps every registration and the listen call together." The current design splits it: registrations live in `build`'s try (which closes on failure and re-throws), and the port-claim ("listen") lives in `app-start`'s try (which closes on failure and exits). Both honour the same guarantee — close on failure — but the close-then-log-fatal block is written twice. The split is a reasonable ownership boundary (build cleans up what build made; start cleans up a successful build whose listen failed), and partial success still flows through a cleanup path, so this is not a defect. Noted as an FYI in case a future consolidation is wanted.

## Strengths observed

- **Bootstrap ordering and exit discipline are textbook.** `validateEnv` runs before any instance construction and calls `process.exit(1)` on failure (`app-start.helper.ts:60-78`); the success path constructs, registers, then claims the port; every catch closes the instance and, where an instance exists, `flush`es the logger before `process.exit(1)` (`app-start.helper.ts:104-113`). Non-zero exit everywhere — no `return`-without-exit that would leave a listenerless worker looking healthy.
- **Environment failures report the full set.** `getFormattedZodIssueLines(result.error.issues)` (`env-var.helper.ts:23`) formats every offending variable in one run, matching the plan's "report every offending variable, not just the first."
- **One typed instance alias, all five slots named.** `instance.type.ts` spells out server / incoming-message / response / logger / type-provider once; `withTypeProvider<OpenApiTypeProvider>()` is called exactly once at construction (`app-build.helper.ts:62`) and every route imports `AppInstance` — no alias drift, no call-site re-parameterisation (confirmed by grep: the only `FastifyInstance<` and `withTypeProvider` in `app/server` are the alias and the single construction site).
- **`disableRequestLogging: true` is correctly paired with a configured logger instance** (`app-build.helper.ts:59-60`) — the default access log is suppressed and the logger owns request observability, exactly the deliberate pairing the plan calls out.
- **Route organisation is clean.** One plugin per resource (`db.route.ts`, `server.route.ts`), all plugins async even where the body is synchronous, named handlers (`readDbHealth`, `readServerHealth`) rather than inline lambdas, relative paths with the base URL applied once at registration (`prefix: API_HEALTH`), and schemas attached via the shared `satisfies OpenApiSchema` wrapper.
- **Server constants compose and freeze correctly.** `BASE_URLS` derives from `ROUTE_NAMESPACES.API` plus per-resource prefixes, so a namespace change flows everywhere and each file owns only its own literal; the objects are `Object.freeze({...} as const)`. No environment-derived value (port, service identity) leaks into the constants tree — those flow from the validated env surface.

## Out of scope

Cross-area leads surfaced for the owning reviewer — not investigated or fixed here.

- **Modules (shutdown route handler style).** `app/server/modules/shutdown/routes/shutdown/shutdown.route.ts:22` passes an inline arrow `(request, reply) => {…}` straight to `instance.post`, rather than a named handler. The route-organisation "named handler, not inline lambda" criterion applies by analogy, but the file is modules-tier — flagged for the **modules** plan reviewer.
- **Validation / shared (env-shape cast).** `app/server/helpers/app/app-env.helper.ts:11` wraps the `ViteAppEnv → AppEnv` camelCase key remap in `castAsType<AppEnv>(...)`. The remap is asserted, not type-checked, so a new `AppEnv` field would not be caught at compile time — the mapping and the runtime shape could silently diverge. Lead for the **validation** / **shared** reviewer (the `AppEnv` derivation).
- **Validation (stringly-typed error discriminator).** `app/server/helpers/app/env-var.helper.ts:12-13` discriminates env-validation failures via `error.name === "EnvValidationError"` on a plain `Error` whose `.name` is mutated after construction (lines 22-28), rather than a typed error class. Fragile if the name string drifts. Lead for the **validation** plan (typed-error / issue-code vocabulary and failure formatting are that plan's concern).
- **Logging (logger wiring & redaction).** The instance is built with a custom `loggerInstance: buildLogger(appEnv, [...redactPaths])` rather than `logger: true`, and the redaction paths flow in from the shutdown module (`app-build.helper.ts:60`, `shutdown.module.ts`). The logger-module internals, level vocabulary, and redaction-path discipline belong to the **logging** plan.
