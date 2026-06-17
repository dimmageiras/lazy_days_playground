# 0015. The remote shutdown channel: a loopback-only, token-gated, single-shot route that arms after the response flushes

- **Status:** Accepted
- **Date:** 2026-06-17

## Context

Graceful shutdown needs an in-band trigger: a way for a same-host operator or a successor process to ask the running server to begin its teardown without sending an OS signal. Exposing teardown over HTTP turns the most destructive operation the process can perform into a request anyone reaching the listener could send — and the single-listener decision binds that listener on the one address the whole service answers on, so the path is reachable, not private. Standing this up forces several coupled decisions at once: how to authenticate the caller, where the route lives relative to ordinary routes, when the teardown actually fires relative to the reply, and how the credential stays out of the logs.

Several forces constrain the answer:

- The capability is destructive and remotely addressable, so a single factor — "it is an internal endpoint" — is not isolation; a leaked secret with no network confinement is remotely exploitable.
- The cooperative handover the startup side depends on needs a definite acknowledgement: the caller must learn the request was accepted _before_ the socket goes away, or it cannot confirm the incumbent is yielding.
- Socket completion is not a single deterministic event; depending on transport, either a normal finish, an abrupt close, both, or neither may fire, so arming on one event is fragile.
- The credential travels in a request header, and the flush-before-exit rule means failure lines reach the logs — a credential logged verbatim is a secret in the log store.

## Decision

**Graceful shutdown is triggered in-band over HTTP through one privileged route that authorizes only a loopback source presenting a constant-time-compared secret, replies before it arms, and arms the teardown exactly once.** The unified stance has five facets.

- **Three independent checks gate the route.** A request is authorized only if all three hold: the reported source address is in the loopback allow-list, the credential header is present and is a string, and it matches the configured secret compared in constant time over equal-length buffers. This is defense in depth — network-layer loopback confinement, a high-entropy secret, and a timing-safe compare stacked, not a single factor — because the bind-all listener means the path is reachable rather than private. Any check failing rejects the request with the unauthorized status and a `warn` line carrying the source address.
- **The route lives in a privileged operational namespace.** It registers under a reserved internal namespace on the one instance, distinct from the observable health namespace, so a route's privilege level is legible from its path. There is no second admin port; the isolation the single-listener decision pushed down to the application layer is realised here as a path namespace plus the loopback-and-token guard, not as a separate listener.
- **The response flushes before teardown arms.** An authorized request receives the accepted status, and only after the HTTP response has fully flushed at the socket level does the route arm the actual teardown. Arming before the response flushes would drop the acknowledgement the caller is waiting on and break the handover the startup side depends on; the ordering — acknowledge, then tear down — is the contract.
- **Arming is single-shot.** A single armed flag guards the trigger so the close funnel fires exactly once even when more than one socket-completion event arrives. Listening to both the normal-finish and the abrupt-close events behind that one flag is the robust form, because depending on transport either one, both, or neither fires; the flag makes the trigger idempotent across all of those.
- **The credential is supplied by the env contract and kept out of logs.** The secret reaches the route as a branded, validated environment value, so the compare runs against a proven value rather than a raw primitive. The header carrying it sits on the module's redaction path, so it is censored in logs by construction rather than by reviewer vigilance — the owning module declares its own sensitive paths.

## Alternatives considered

- **Token-only auth with no loopback restriction.** Rejected: a leaked secret would be remotely exploitable; loopback gating confines the blast radius to the same host as cheap defense in depth.
- **Plain string equality on the credential.** Rejected: leaks timing; a constant-time compare over equal-length buffers closes the side channel.
- **No auth, relying on the endpoint merely being "internal".** Rejected: any local or proxied client could shut the server down; "internal" is a path label, not isolation.
- **Close the instance synchronously inside the handler before replying.** Rejected: the acknowledgement never reaches the caller, so the handover client cannot confirm acceptance.
- **OS signal only, no in-band route.** Rejected: cross-process signalling needs the owner's process identifier and OS permissions; an authenticated in-band request is portable and lets the incumbent drain gracefully. Revisitable as a new decision if a deployment standardises on signal-based orchestration.
- **Put the endpoint on a separate admin port.** Rejected by the single-listener decision; isolation comes from the path namespace and the application-layer guard instead. Revisitable as a new decision if an admin surface ever needs port-level isolation.
- **Arm on a single socket event.** Rejected: either completion event can fire, both, or neither depending on transport; a single-shot flag over both is robust where a single listener is not.
- **Hard-code the redaction path inside the logger.** Rejected: couples the logger to every consumer's header names; the owning module exports its sensitive paths and the logger stays agnostic.

## Consequences

**Positive**

- **Layered, not single-factor, kill capability.** The teardown trigger is reachable only by a same-host caller holding a high-entropy secret, compared without a timing side channel — three checks must all hold.
- **Privilege is legible from the path.** A route's privilege level is readable from its namespace, and the privileged endpoint shares the one address the lifecycle decision promised, with no second port to discover or secure.
- **A definite verdict precedes teardown.** The caller always gets an accept or a reject before any teardown begins, which is what makes the cooperative handover protocol possible at all.
- **Idempotent arming.** The single-shot flag prevents a double close of the orchestrator no matter how many socket-completion events arrive.
- **Censored by construction.** The credential header is redacted in logs by the module that introduced it, not by a reviewer remembering to strip it.

**Negative (accepted)**

- **A remote teardown surface now exists.** It must stay loopback-bound and token-gated forever; any future change that widens its reachability is a security regression, not a feature, and there is no compiler check that holds the line.
- **Loopback gating trusts the reported source address.** Behind a proxy that rewrites the source, the check can be bypassed or wrongly blocked unless proxy-trust settings are correct — the confinement is only as honest as the address the framework reports.
- **Correctness rides on raw socket-event semantics.** The acknowledge-then-arm ordering and the dual-event arming depend on low-level completion semantics that are easy to regress if the handler is refactored, with no test that captures the timing relationship by structure.
- **The redaction path is a hand-kept string.** The owning module must keep the redaction path in sync with the header name; a renamed header silently stops being redacted until someone notices.

## Related

- [`./0014-graceful-shutdown-lifecycle.md`](./0014-graceful-shutdown-lifecycle.md) — the teardown lifecycle this route hands control to once it arms; the close funnel the single-shot flag fires exactly once.
- [`./0016-cooperative-port-handover.md`](./0016-cooperative-port-handover.md) — the handover protocol that depends on this route acknowledging before it tears down, so a successor can confirm the incumbent is yielding.
- [`./0017-environment-contract-extensions.md`](./0017-environment-contract-extensions.md) — the env-contract extension that admits and brands the credential this route compares.
- [`./0018-internal-control-plane-namespace.md`](./0018-internal-control-plane-namespace.md) — the reserved internal namespace this privileged route registers under, distinct from the observable health namespace.
- [`./0011-single-port-server-lifecycle.md`](./0011-single-port-server-lifecycle.md) — the single listener this route registers on, and the application-layer isolation it pushed downstream that this route realises as a namespace plus guard.
- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the validated, branded contract the credential enters through, so the route compares a proven value rather than a raw primitive.
- [`./0010-logging-and-error-handling.md`](./0010-logging-and-error-handling.md) — the redaction discipline that censors the credential header and the normalization the warn-on-reject line flows through.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module/helper boundary the route, its authorization, credential-compare, and arming helpers sit behind.
- [`../logging/README.md`](../logging/README.md) — the redaction-path discipline this route's censored header depends on.
- [`../../CONTEXT.md`](../../CONTEXT.md) — **Load-bearing decision**, **Module**, and the **Rename test** this ADR is written to survive.
