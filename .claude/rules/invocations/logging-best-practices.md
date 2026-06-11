# Invoke `logging-best-practices`

Invoke the `logging-best-practices` skill when adding or changing how the application emits logs.

## Triggers

- Adding or editing a log call — `instance.log.*`, `request.log.*`, or any `logger.*` site — in a route, helper, module, or the startup path.
- Touching the logger module (factory, options, transport, redaction paths) under `app/server/modules/logger/**`.
- Choosing or changing a log **level**, the structured **context shape**, or a **redaction** path.
- Reviewing log call sites (own changes, another agent's output, or a PR's logging).

## Pair with the project's logging documentation

The skill is the upstream Pino reference. The project's own logging conventions — the level vocabulary, the context-object-first shape (`{ ...normalizeError(error), … }`), the emoji prefixes (`🚧` warn, `💥` error, etc.), redaction-path discipline, and the flush-before-exit rule — live in [`../../../docs/logging/README.md`](../../../docs/logging/README.md). **Read it first.**

Where the upstream skill and the project doc diverge, the **project doc wins**. The skill teaches structured-logging principles; the doc teaches how this codebase applies them.

In particular, the skill is written for a Next.js stack and those specifics do **not** apply here:

- ignore `import { logger } from "@/lib/logging/logger"` — this is a Fastify server that logs through `instance.log` / `request.log` (the Pino instance built by the logger module);
- ignore the App Router `POST(request: Request)` handler shape and the `"use step"` workflow wrapper — there is no such runtime here.

Carry over the transferable parts: the **context-object-first signature**, the **level table**, putting the error under the context (the project spells it `{ ...normalizeError(error) }`, not a raw `{ err }`), and **logging on the way out** with timing context.

## Boundaries with other skills

- **Cross-cutting code review** → also invoke `code-review-and-quality` per [`./code-review.md`](./code-review.md) (the area-skill table lists this skill for logging diffs).
- **Editing the logging documentation itself** → also invoke the `doc-editing` rule ([`./doc-editing.md`](./doc-editing.md)).
- **Fastify request-lifecycle logging** (hooks, serialization, the Pino integration) → also consult `fastify-best-practices`.
- **Node graceful-shutdown / error-path logging** → also consult `node`.
