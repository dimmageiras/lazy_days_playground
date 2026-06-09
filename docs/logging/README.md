# Logging Conventions

This README is the canonical project doc for **how the server logs**. The logging
stack is Pino, integrated through Fastify's logger instance. This doc describes the
rules; where it and the upstream Fastify/Pino guidance diverge, this doc wins for how
this codebase logs.

## Scope

- The level vocabulary and when each level is appropriate.
- The shape of a log call — structured fields plus message.
- Message-text conventions (prefixes, phrasing by call site).
- What must never be logged.
- Process-exit flushing.

It does **not** cover transport/format selection (development pretty-printing vs
production JSON) — that is a property of how the logger is built from the validated
environment, and is settled there.

## Levels

| Level    | When                                                                       |
| -------- | -------------------------------------------------------------------------- |
| `trace`  | Very detailed, per-step debugging.                                         |
| `debug`  | Debugging information useful while diagnosing.                             |
| `info`   | Startup, configuration, and graceful-shutdown state transitions.           |
| `warn`   | A recoverable anomaly — degraded but continuing.                           |
| `error`  | A failure that aborted the operation in hand.                              |
| `fatal`  | A failure that terminates the process.                                     |
| `silent` | Disables all output — configuration-only; never used as a call-site level. |

Two rules carry most of the weight:

- **`info` is for lifecycle, not success.** Use it for "service started", "config
  loaded", "received signal, shutting down". Do **not** log `info` on a successful
  request or operation — a success path returns its result without a log line.
- **`fatal` precedes process termination.** If the next thing the code does is exit
  the process, the failure is `fatal`, not `error` (see [Flush before exit](#flush-before-exit)).

## Shape of a log call

Error and warning calls take a **structured object first, message second**:

```ts
logger.error(
  { error: error.message, stack: error.stack /*, …context */ },
  "💥 Failed to do the thing",
);
```

- The first argument is a plain object of contextual fields. Spell out `error` (the
  message string) and `stack` explicitly rather than passing the raw `Error` as the
  whole payload — a bare `logger.error(err)` loses the message/stack distinction and
  the contextual fields.
- The second argument is the human-readable message.

### Normalize the error first

A `catch` binding is `unknown`. Normalize before reading `.message` / `.stack`:

```ts
const error = rawError instanceof Error ? rawError : new Error(`${rawError}`);
```

### Informational and lifecycle calls

`info` lifecycle lines are a message only — dynamic values go in a template string,
state transitions in a static prefixed string. Reserve the structured object form for
`error` / `warn`, where contextual fields matter:

```ts
logger.info("✅ Service initialized");
logger.info(`🚀 Server started at ${address}`);
logger.info(`🤖 Log level set to ${level}`);
logger.info(`Received ${signal}, shutting down…`);
```

## Per-request context

Inside a request lifecycle, log through the **per-request logger** rather than the
root logger — it automatically carries the request id, so every line for one request
correlates. Outside a request (startup, shutdown, plugin wiring), the root logger is
correct.

Always include a request identifier in request-scoped error context, plus whatever
domain fields aid diagnosis (e.g. a resource id, an email used for lookup).

## Message conventions

Emoji prefixes give logs a fast visual scan:

| Prefix | Meaning                                             |
| ------ | --------------------------------------------------- |
| 💥     | Error.                                              |
| ✅     | Success — startup/configuration only, never routes. |
| 🚀     | Server / service start.                             |
| 🤖     | Configuration detail.                               |
| 🚧     | Warning.                                            |

Pick the error-message phrasing by call site, not by reflex:

1. **Inside an operation/route handler** → operation-style: `"💥 [Operation] failed"`.
2. **Around lifecycle wiring (registering a plugin, building the app, shutting down)**
   → `"💥 Failed to [verb the thing]"`.
3. **A hook or the global error handler** → subject-noun: `"💥 [Subject] error"` /
   `"💥 Unhandled …"`.

## Never log secrets

Passwords, authentication tokens, API keys, and full card numbers must never reach a
log line. Request ids, user ids, email addresses (as lookup context), and error
messages are safe. Enforce this structurally with the logger's redaction paths rather
than relying on every call site to remember — a unit that reads a sensitive field
should contribute its own redaction paths so the composition layer stays unaware of
which fields are sensitive.

## Flush before exit

Pino flushes its transport on a worker thread. A direct `process.exit` can terminate
the process before the last line is written — so a `fatal` line emitted immediately
before exit can vanish. On any path that logs and then exits, **flush the logger and
exit from the flush callback** rather than exiting synchronously. The logger surface
exposes a flush method for exactly this — call it and exit from its callback.

The exception is a logger backed by a **synchronous destination**: it writes each line
inline rather than handing it to a worker thread, so a `fatal` line is on disk before
the call returns. Such a logger may exit directly after the `fatal` log without a flush
callback — there is no async write to race. Reserve this for the startup-failure paths
that must exit before the validated logger exists, where the synchronous write is worth
the throughput cost; the long-lived request logger stays on the worker-thread transport
and uses the flush-callback rule above.

## Related

- [`../adr/0009-bootstrap-environment-validation.md`](../adr/0009-bootstrap-environment-validation.md)
  — the startup validation gate that produces the validated environment the logger is
  built from.
- [`../../CONTEXT.md`](../../CONTEXT.md) — the **Module** term; the logger is a module
  that owns this capability.
