# Code Review Findings: Bootstrap Module

## Summary

- Total findings: 9
- Blockers: 0
- Warnings: 4
- Nits: 4
- Info: 1

Overall verdict: The bootstrap module is well-structured and the cooperative-then-force handoff protocol is sound. Token comparison is timing-safe over equal-length buffers, the IP allowlist uses configured loopback identifiers, `process.kill` only targets a PID discovered locally via netstat parsing, and the four helper concerns are cleanly separated. The cooperative-shutdown route uses `reply.raw.on("finish")` correctly so the 202 actually reaches the requester before `app.close()` fires. The findings below are mostly polish items plus a few subtle robustness concerns: non-`EADDRINUSE` listen errors bubble silently past `claimPort` with no app log, the kill helper is Windows-only with no documentation of that constraint, the close-with-grace error-logger fallback prints to bare `console`, and the cross-stack `::ffff:127.0.0.1` mapped-IPv4 case is not handled by the IP allowlist. None block merge; the warnings should be addressed before this module is considered stable.

## Findings

### [warning] Non-`EADDRINUSE` listen errors bubble out of `claimPort` with no operator-visible log

**File:** `app/server/modules/bootstrap/helpers/listen.helper.ts:21-27` and `app/server/modules/bootstrap/bootstrap.module.ts:32-64`
**Skill / criterion:** `code-review-and-quality` (correctness — error paths handled), plan focus "Edge cases — the listen helper distinguishes `EADDRINUSE` from other errors (re-throws the rest)"

`tryListen` rethrows any non-`EADDRINUSE` error. The caller `claimPort` does not wrap the listen calls in `try/catch`, so the rejection propagates to top-level `await claimPort()` in `server.ts` and surfaces as an unhandled rejection / process crash with no structured `app.log.error({ err }, ...)` entry. The plan's logging focus ("Errors are logged with the actual error object, not just a message") and the orchestrator's own pattern of logging each branch transition is broken for this branch — an operator running `pnpm dev` sees a raw stack trace rather than a labelled error.

**Suggested fix:**

```ts
// In bootstrap.module.ts — wrap the listen attempts so failures are logged
const claimPort = async (): Promise<void> => {
  try {
    if (await tryListen(app, port)) return;
    // ...rest of orchestration
  } catch (error) {
    app.log.error({ err: error }, `Listen failed on port ${port} — aborting.`);
    process.exit(1);
  }
};
```

---

### [warning] Pino error key should be `err`, not `error`, for stdSerializers to format properly

**File:** `app/server/modules/bootstrap/helpers/close.helper.ts:15-17`
**Skill / criterion:** `fastify-best-practices` (logging with Pino), `code-review-and-quality` (readability)

Fastify wires `pino.stdSerializers.err` for the `err` key. Logging `{ error }` bypasses the serializer, so the field is rendered with default object-stringification instead of the structured `{ type, message, stack, code, ... }` representation. Stack traces and `code` properties (e.g. `ECONNREFUSED`) end up cut off or `[object Object]`-ish depending on the underlying error.

**Suggested fix:**

```ts
async ({ signal, manual, err: error }) => {
  if (error) {
    app.log.error({ err: error }, "server closing with error");
  }
  // ...
};
```

---

### [warning] `close-with-grace` is constructed without a logger, so its internal warnings/timeouts print to bare `console`

**File:** `app/server/modules/bootstrap/helpers/close.helper.ts:12-31`
**Skill / criterion:** `node` (graceful-shutdown — error visibility), `code-review-and-quality` (architecture — logging consistency)

`closeWithGrace` defaults to `logger: console` when the option is omitted. Its own messages — `killed by timeout (10000ms)`, `second SIGTERM, exiting`, top-level errors from the user callback — therefore bypass the Fastify Pino instance and land in stdout as unstructured text. This breaks log aggregation in any environment that consumes structured JSON, and the "killed by timeout" message is exactly the kind of operator-critical event that should be at warn/error level in the app stream.

**Suggested fix:**

```ts
closeWithGrace(
  {
    delay: GRACEFUL_SHUTDOWN_TIMEOUT_MS,
    logger: app.log,
  },
  async ({ signal, manual, err: error }) => {
    /* ... */
  },
);
```

---

### [warning] IP allowlist does not handle dual-stack-mapped IPv4 (`::ffff:127.0.0.1`)

**File:** `app/server/modules/bootstrap/routes/shutdown.route.ts:38-40`
**Skill / criterion:** plan focus "Security — IP allowlist comparison uses configured loopback identifiers"

With the current `BIND_ALL = "0.0.0.0"` the server is IPv4-only and `request.ip` should arrive as `127.0.0.1`, so the check passes. The instant the bind address is broadened to `::` (any IPv6, dual-stack) — a one-line change in `network.constant.ts` — incoming loopback IPv4 connections will surface as `::ffff:127.0.0.1` on most platforms, fail both equality checks, and the route will start 403'ing legitimate handoffs. The configured IPv4 loopback (`HOST_LOOPBACK = "127.0.0.1"`) and the literal `LOOPBACK_IPV6` ("::1") miss this third form.

This is a fragility issue, not an exploit — but it's the kind of latent footgun that surfaces only once someone flips the bind host and then debugs for an hour.

**Suggested fix:**

```ts
const LOOPBACK_MAPPED_IPV4 = "::ffff:127.0.0.1";

const isLoopback = (ip: string): boolean =>
  ip === hostLoopback || ip === LOOPBACK_IPV6 || ip === LOOPBACK_MAPPED_IPV4;

if (!isLoopback(request.ip)) {
  return response.code(FORBIDDEN).send({ ok: false });
}
```

(Adjust the constant's home to `network.constant.ts` to match the existing pattern.)

---

### [nit] `findPidOnPort` shadows the global `process` with the spawned child handle

**File:** `app/server/modules/bootstrap/helpers/kill.helper.ts:7,14,18`
**Skill / criterion:** `code-review-and-quality` (readability), `node` (idioms)

```ts
const process = spawn("netstat", ["-ano"]); // shadows global
```

The variable name is fine inside the closure but later in the same file `process.kill(pid, signal)` reaches for the global `process` — different scope so no actual bug, but a reader has to mentally track which `process` is which. Rename the local handle.

**Suggested fix:**

```ts
const netstat = spawn("netstat", ["-ano"]);
let stdout = "";
netstat.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
netstat.on("error", () => resolve(null));
netstat.on("close", () => { /* ... */ });
```

---

### [nit] Force-kill helper is Windows-only (`netstat -ano`) with no comment or platform guard

**File:** `app/server/modules/bootstrap/helpers/kill.helper.ts:5-26`
**Skill / criterion:** plan focus "Race conditions and Windows quirks — Signal mapping on Windows is documented in the comments or implicit in code", `.claude/rules/code-comments.md` (WHY non-obvious gets a comment)

`netstat -ano` produces the exact column layout the parser assumes only on Windows. On Linux/macOS the same command either prints different columns or is absent. The cooperative HTTP path is the cross-platform fallback the plan calls out, but a reader of `kill.helper.ts` in isolation has no way to know this helper is platform-bound — and the parser will silently return `null` on POSIX (`netstat -ano` errors or yields no `LISTENING` line), then `killPortOwner` returns `false`, then `claimPort` exits 1 with no clue that the only thing wrong is "you tried to force-shutdown on Linux."

Add a single-line comment naming the platform contract and (optionally) guard with `process.platform === "win32"` so non-Windows hosts hit a fast failure instead of waiting on a misparsed netstat.

**Suggested fix:**

```ts
// `netstat -ano` and the trailing-PID column layout below are Windows-specific.
// Cooperative HTTP shutdown is the cross-platform path; force-kill works only on Windows.
const findPidOnPort = (port: number): Promise<number | null> =>
  new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve(null);
      return;
    }
    /* ... */
  });
```

---

### [nit] `reply.raw.on("finish")` lacks the rationale comment the plan explicitly calls out

**File:** `app/server/modules/bootstrap/routes/shutdown.route.ts:46-48`
**Skill / criterion:** plan focus "`reply.raw.on('finish')` is used (not a higher-level Fastify hook) because we need the 'single response finished' event; this should be flagged as deliberate", `.claude/rules/code-comments.md`

The plan flags this as a deliberate choice that future maintainers may try to "clean up" into an `onResponse` hook (which is app-wide and not per-reply). The WHY is non-obvious — exactly the case `.claude/rules/code-comments.md` says justifies an inline comment.

**Suggested fix:**

```ts
// Per-reply finish hook: triggers `app.close()` only after THIS response's
// bytes are flushed to the requester, so the caller actually sees the 202
// before the server stops accepting. Fastify's `onResponse` hook is app-wide
// and fires per request, but the wiring here is more direct via raw.
response.raw.on("finish", () => {
  void closeListeners.close();
});
```

---

### [nit] Naming drift between `shutdownToken` (factory bag) and `token` (route/request config)

**File:** `app/server/modules/bootstrap/types/bootstrap.type.ts:4-32` and the helpers/route that destructure `token`
**Skill / criterion:** `code-review-and-quality` (readability — names consistent with project conventions), `typescript-magician` (interface clarity)

`BootstrapConfigOptions.shutdownToken` is renamed mid-flight to `ShutdownRouteConfig.token` and `ShutdownRequestConfig.token`. Both refer to the same secret. The shorter name is fine inside the route/helper scope where context is unambiguous, but the rename happens silently in the factory body (`token: shutdownToken`) — a future reader grepping for `shutdownToken` will miss every helper that uses it. Pick one name and use it across the module, or document the rename intent.

**Suggested fix:**

Either thread `shutdownToken` through unchanged, or — if the short name is preferred at the seam — rename `BootstrapConfigOptions.shutdownToken` to `BootstrapConfigOptions.token`, since the factory is already namespaced as "bootstrap".

---

### [info] `tryListenUntil` polls Fastify state across attempts — Fastify rolls back `listening` on `EADDRINUSE`, so this works, but it relies on internal state behaviour

**File:** `app/server/modules/bootstrap/helpers/listen.helper.ts:30-46`
**Skill / criterion:** `fastify-best-practices` (lifecycle), plan focus "Race conditions — listen-then-fail pattern handles socket release"

The loop calls `app.listen()` repeatedly. Each failed call leaves the Fastify instance in a state where `kState.listening` is reset to `false` (the `errEventHandler` in `listenPromise` does this), so the next call is accepted. This is the correct primitive — better than an isolated `getPort`-style probe that opens and immediately closes a socket and races the OS — but it depends on a Fastify-internal invariant. If a future Fastify major changes that state machine (e.g. requires explicit reset after error), `tryListenUntil` silently breaks.

No code change requested — worth knowing when bumping `fastify` major versions: re-verify the EADDRINUSE-retry path against the changelog.

---

## Strengths observed

- Token comparison uses `crypto.timingSafeEqual` over equal-length buffers, gated on a length pre-check and a `typeof === "string"` guard, and both rejection paths return the same `UNAUTHORIZED` status — exactly the timing-attack defence the plan calls out.
- Branches in `claimPort` are exhaustive and the cooperative-then-force fallback has bounded timeouts at every wait, with operator-visible warn/error logs at each transition (port-in-use, cooperative-failed, sending SIGTERM, port-still-in-use).
- Factory cleanly closes over its config; the returned tuple uses `as const` so the spread into `app.register(...shutdownRouteWithListeners)` keeps its plugin-args shape.
- Helpers are split by single concern (close, listen, kill, shutdown-request, route), and the cooperative-shutdown contract is genuinely shared at the type level via `ShutdownRequestConfig extends ShutdownRouteConfig`.
- `process.kill` is only ever called with a PID the module itself discovered via netstat — no external input touches the kill target.

## Out of scope

- `app/server/constants/server.constant.ts` hardcodes `SHUTDOWN_TOKEN: "dev-shutdown-token"`; the existing TODO already flags moving this to environment configuration. Belongs to the configuration review area.
- The shutdown route's `POST /internal/shutdown` payload has no JSON Schema validation/serialization; the route is bodyless but Fastify-idiomatic style would still attach a `response: { 202: …, 401: …, 403: … }` schema. Belongs to the schemas/routing review area.
- `server.ts` registers the shutdown route as a top-level plugin rather than under an encapsulated `/internal` prefix-scope plugin; the route's encapsulation, not its internals, belongs to the server-composition review area.
