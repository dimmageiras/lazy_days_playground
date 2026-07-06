# Invoke `observability-and-instrumentation`

Invoke the `observability-and-instrumentation` skill when making the running system's behaviour visible from the outside — the strategic layer above individual log lines: what to instrument, why, and how to prove it works.

## Triggers

- Shipping a feature that runs in production and needs evidence it works — especially one that adds I/O, retries, queues, background jobs, or cross-service / external calls.
- Adding or changing **metrics** (RED/USE, histograms, `prom-client`), **distributed tracing** (OpenTelemetry SDK, spans, context propagation), or **alerting** rules.
- Defining the on-call questions a feature must answer, or mapping signals (log vs metric vs trace) to those questions.
- A production incident took too long to diagnose because the telemetry wasn't there.
- Reviewing a PR that introduces external calls, retries, or queues with no new telemetry.

## Pair with the project's logging conventions — and defer log-line specifics

This skill's **Structured logging** section is generic (a plain JSON `logger`, a four-level scheme, an Express correlation-ID middleware). It is written for a stack this project does not run. For **how a single log line is written in this codebase**, the project conventions win:

- The tactical log-call rules — the Pino level vocabulary (`trace`…`fatal` + `silent`), the context-object-first signature, `normalizeError`, the emoji prefixes, redaction-path discipline, and the flush-before-exit rule — live in [`../../skills/logging-best-practices/SKILL.md`](../../skills/logging-best-practices/SKILL.md) and, canonically, in [`../../../docs/logging/README.md`](../../../docs/logging/README.md). Also apply the [`logging-best-practices`](./logging-best-practices.md) invocation rule. **Read the project doc first; where it and this skill diverge on logging, the project doc wins.**
- Carry over the transferable, stack-neutral parts of this skill: define the on-call questions first, pick the right signal per question, RED/USE metrics with bounded label sets, percentiles over averages, OpenTelemetry tracing, and symptom-based alerting.
- Correlation IDs: the project already carries a request id on the per-request logger (see the **Per-request context** section of the logging doc). Reuse that; do not add a second correlation mechanism.

The at-a-glance checklist is vendored at [`../../references/observability-checklist.md`](../../references/observability-checklist.md).

## Note on current stack maturity

The runtime logs through Pino only — there is no metrics, tracing, or alerting infrastructure installed yet. Until that changes, the metrics/tracing/alerting guidance is forward-looking: apply it when the infrastructure lands or when a change introduces the external calls / queues that warrant it, not as a demand to bolt telemetry onto code that has none.

## Boundaries with other skills

- **Writing individual log calls / the logger module** → `logging-best-practices` (and the logging doc) own that; this skill sits above it.
- **Diagnosing a failure happening right now** → `diagnosing-bugs`, not this skill. Observability is what makes that skill fast next time.
- **Profiling and optimising measured slowness** → `performance-optimization`.
- **Not leaking secrets / PII through the telemetry pipeline** → `security-and-hardening`; this skill inherits its no-secrets-in-logs rule.
- **Cross-cutting code review** of a telemetry diff → also invoke `code-review-and-quality` per [`./code-review.md`](./code-review.md) (the area-skill table lists this skill for telemetry diffs).
- **Fastify request-lifecycle instrumentation** (hooks, serialization, the Pino integration) → also consult `fastify-best-practices`.
