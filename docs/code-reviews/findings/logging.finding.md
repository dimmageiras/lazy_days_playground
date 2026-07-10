# Logging — Review Findings

## Summary

| Severity | Count |
| -------- | ----- |
| Blocker  | 0     |
| Warning  | 0     |
| Nit      | 2     |
| Info     | 2     |

Reviewed against the logging plan with `code-review-and-quality`, `fastify-best-practices`, `node`, and `typescript-magician`, checking adherence to [`docs/logging/README.md`](../../logging/README.md). The logging capability is in good shape. The logger module is a clean factory over the validated environment (no import-time reads), the option-assembly logic is a pure, separately-tested helper, the transport constant is a frozen `satisfies`-checked value, and the fallback logger correctly uses a **synchronous destination** so its report-then-`process.exit` path races nothing. The typed logger surface (`FastifyBaseLogger & LoggerExtras`) exposes `flush`, and the composition layer genuinely uses the flush-callback exit for the worker-thread logger. Call sites follow the level/shape/normalize/emoji conventions consistently, the shutdown module contributes its own redaction path, and the branded log-level stays assignable to Pino's `level`. No blockers or warnings in scope; two nits on the build-failure logging path and two forward-looking info notes. Gates verified locally: `pnpm typecheck` (`tsc -b`) clean; `pnpm test:server` green — **118 tests across 21 files**.

## Findings

### Nits

#### N1 — Build-failure path logs the same error twice, and the build-layer line can be lost at exit

- **Severity:** nit
- **Files:** [`app/server/helpers/app/app-build.helper.ts:80-82`](../../../app/server/helpers/app/app-build.helper.ts), [`app/server/helpers/app/app-start.helper.ts:82-100`](../../../app/server/helpers/app/app-start.helper.ts)
- **Flagged by:** `logging-best-practices` / logging README (flush before exit) + `node` (async transport races `process.exit`)

When `build` fails it logs `instance.log.error(normalizeError(error), "💥 Failed to build the app")` on its own (worker-thread in dev / async-stdout in prod) instance logger, then re-throws. The only caller, `start`, catches, finds `!instance` (the assignment never completed), builds a **separate** synchronous fallback logger, logs the same error as `fatal("💥 Failed to start the server")`, and calls `process.exit(1)`. Two consequences:

1. The build-layer `error` line is on an async logger that is never flushed before the synchronous fallback exit, so in development that line can vanish (the worker thread may not have written it). The error's message/stack still survive via the fallback `fatal` line, so the loss is the more-specific "build" framing, not the error itself — hence a nit, not a warning.
2. One terminal failure produces two log lines carrying the same normalized error under two messages.

The error-vs-fatal split across layers is itself correct (build aborts an operation → `error`; start terminates the process → `fatal`). The issue is only that the build-layer line is redundant on this path and unflushed. Suggested fix: let the exit-owning layer own the terminal log (drop the `instance.log.error` in `build`'s catch and rely on `start`'s `fatal`), or flush the build instance logger before the fallback exit. Prefer the former — it removes the duplicate and the loss in one move.

#### N2 — Redundant double error-normalization in the build catch

- **Severity:** nit
- **File:** [`app/server/helpers/app/app-build.helper.ts:80-82`](../../../app/server/helpers/app/app-build.helper.ts)
- **Flagged by:** `code-review-and-quality`

`const error = toError(rawError)` is followed by `normalizeError(error)`, and `normalizeError` calls `toError` again internally. The `toError` call exists so the `throw error` at the end throws a real `Error`; passing the already-`toError`'d value into `normalizeError` just re-runs the same idempotent conversion. Harmless but slightly redundant. Suggested fix: since `normalizeError` already normalizes, this is fine to leave; if tightening, read `{ error: error.message, stack: error.stack }` inline from the already-converted `error` rather than round-tripping through `normalizeError`. Stylistic — not blocking.

### Info

> Info entries are observations, not change requests. Kept here (and out of any PR thread) per the findings README severity vocabulary.

#### I1 — `logger.flush(cb)` and the worker-thread transport (dev only)

- **Files:** [`app/server/helpers/app/app-start.helper.ts:113`](../../../app/server/helpers/app/app-start.helper.ts), [`app/server/modules/logger/constants/logger.constant.ts:3-9`](../../../app/server/modules/logger/constants/logger.constant.ts)
- **Flagged by:** `node` / `fastify-best-practices` (Pino v10 transport lifecycle)

The flush-callback exit (`instance.log.flush(() => process.exit(1))`) is exactly right for the default async-stdout destination used in production (no `transport`), where `flush` drains the main-thread buffer. With the `pino-pretty` transport (development only), Pino hands lines to a worker thread whose own buffer `flush()` does not strictly guarantee is drained before exit — a fully robust dev shutdown would await the transport close. Because the transport is dev-only and this is a startup-failure path, the exposure is low-stakes; noting it so a future change that moves the pretty transport into production revisits the flush strategy.

#### I2 — No per-request access log by design

- **File:** [`app/server/helpers/app/app-build.helper.ts:58-62`](../../../app/server/helpers/app/app-build.helper.ts)
- **Flagged by:** `observability-and-instrumentation` / `fastify-best-practices`

`disableRequestLogging: true` is paired with the configured `loggerInstance` (correct — the toggle is set deliberately in concert with the logger, not flipped by accident), and the conventions forbid `info`-on-success. The combined effect is that the server emits no per-request access line at all. That is a legitimate, convention-consistent choice today; if request-level observability is later needed, it must be added explicitly (e.g. a custom `onResponse` hook logging method/path/status/latency through the per-request logger), since flipping `disableRequestLogging` back on would route through Fastify's default serializers instead.

## Strengths observed

- **Factory over the validated environment, no import-time reads.** `buildLogger(appEnv, redactPaths)` takes the validated environment; level, `service` base field, development flag, and redaction all flow from the passed `appEnv`, never a literal or a second source ([`app/server/modules/logger/logger.module.ts`](../../../app/server/modules/logger/logger.module.ts), [`.../helpers/logger.helper.ts`](../../../app/server/modules/logger/helpers/logger.helper.ts)).
- **Pure, separately-testable option builder.** `buildLoggerOptions` returns a plain options object asserted with `toStrictEqual` in the helper spec without ever spawning a transport worker — exactly the seam the plan asks for.
- **Fallback logger is the correct deliberate exception.** Minimal (`{ level: "info" }`, no `service` base), backed by `destination({ sync: true })`, so its report-then-`process.exit(1)` on the pre-validation path races no async write. It has not grown to duplicate the real logger's configuration.
- **Frozen, typed transport constant.** `PRETTY_TRANSPORT` is `Object.freeze(... satisfies TransportSingleOptions)`, selected by the development flag, and its string-only `pino-pretty` target is correctly declared in `ignoreDependencies` in [`knip.config.ts`](../../../knip.config.ts) so the unused-dependency checker stays quiet.
- **Typed surface exposes — and uses — the library extras.** `Logger = FastifyBaseLogger & LoggerExtras` names the slot on `AppInstance`, and `instance.log.flush(...)` is genuinely called on the exit path; the branded `LogLevel` stays assignable to Pino's `level` (typecheck clean).
- **Call-site conventions are consistent.** Every `error`/`fatal`/`warn` passes a structured object first (`{ ...normalizeError(err), …context }`) and a message second — no bare `logger.error(err)`; `catch` values are normalized before `.message`/`.stack` are read; emoji prefixes (💥 error, 🚧 warn) and message phrasing (operation-style / "Failed to …" / subject-noun) match the doc; `error`-vs-`fatal` is split correctly by whether the local frame aborts an operation or terminates the process.
- **Per-request logger used where it matters.** The shutdown route logs the unauthorized attempt through `request.log.warn` (carrying the request id) rather than the root logger.
- **Redaction is structural and module-owned.** The shutdown module contributes `REDACT_PATHS` for its own token header and hands it to the composition layer, which stays unaware of which fields are sensitive; `normalizeError` narrows caught values to message+stack, which also prevents the axios error `config.headers` (carrying the shutdown token) from leaking through the cooperative-shutdown warn line.

## Out of scope

Cross-area leads for the reviewers of the neighbouring plans:

- **Shutdown handler flush before the library-managed exit (server / shutdown plan).** `buildShutdownHandler` logs `fatal`/`info` then `await instance.close()` ([`app/server/modules/shutdown/helpers/close-with-grace.helper.ts:31-58`](../../../app/server/modules/shutdown/helpers/close-with-grace.helper.ts)); the actual process exit is orchestrated by `close-with-grace`, not our code, and Fastify's `close()` does not flush Pino. Worth confirming the `fatal` line is written before the library terminates — the flush-before-exit reasoning applies, but the exit orchestration is the server plan's control-flow concern.
- **Silent swallow of `process.kill` failure (server / startup plan + observability).** [`app/server/modules/startup/helpers/claim-port/helpers/kill.helper.ts:69`](../../../app/server/modules/startup/helpers/claim-port/helpers/kill.helper.ts) catches the `process.kill` exception and returns only a `reason` code with no log line, so the specific errno (`EPERM` vs `ESRCH`) is invisible in the logs. Consider a `debug`/`warn` with `normalizeError` at the catch.
- **Redaction coverage if request logging is re-enabled (server plan).** The single redaction path targets `req.headers["<shutdown-token>"]`; it is currently exercised by nothing because `disableRequestLogging: true` and no call site logs full headers. If that toggle is ever flipped or a handler logs the request object, re-verify that every request-borne secret has a redaction path.
