# 0011. Single integrated listener and the build-step readiness boundary

- **Status:** Accepted
- **Date:** 2026-06-16

## Context

The server is a single HTTP application: one framework instance, logging through one logger, serving a health check today and product routes later. Standing it up forces two decisions at once.

First, the listener topology. Services can split traffic across more than one listener (a public application port plus a private port for health, metrics, or admin), bind one instance to several addresses, or terminate TLS in-process by adding an HTTPS/HTTP2 listener. Each shape is defensible somewhere, and each multiplies the surfaces that routing, configuration, and deployment must account for. The configuration the server actually has points the other way: exactly one port is described and validated by the environment contract, arriving as a single validated value — no second port, no host/bind-address field, no protocol selector. Choosing a topology the configuration cannot express would mean inventing configuration to support it.

Second, the bring-up path has two phases that fail for different reasons: **assembling** the instance (decorate with validated config, register routes, load every plugin) and **binding** it to the port. Folding them into one step blurs the failure modes — a caller cannot tell "never finished building" from "built but could not listen", and the two demand different cleanup. Cleanup is the sharp edge: a partially built instance still holds resources (registered close hooks, open plugin handles) even if a later registration throws. If construction throws and nobody closes that half-built instance, it leaks; left implicit, either both builder and caller close it (double-close) or neither does (leak).

## Decision

The application stands up as **one ready instance, then one listener** — a single integrated listener bound to the validated port, fed by a build step that returns only fully-ready instances and self-cleans on failure. The unified stance has four facets.

- **One instance, one port, one listener, plain HTTP.** A single framework instance is constructed; every route — the health check and all future routes — registers on it, with no second instance for any purpose. A single `listen` call binds the one port the environment contract validates and exposes as a validated value; the port is read only from that value, never hard-coded, defaulted at the listen call, or sourced elsewhere. No second listener is opened for metrics, health, or admin, and no extra bind address is configured. The listener speaks plain HTTP; TLS termination, if ever needed, is an out-of-process concern. Health checks, current routes, and operational tooling all address the service at one place.

- **Build is separate from listen, and readiness is the gate.** The build step does everything needed to hand back a fully wired instance: decorate it with the frozen validated environment, register routes under their prefix, then await the framework's readiness signal so every plugin has finished loading before the instance returns. Awaiting readiness — not merely finishing registration — is what makes the post-condition true, because plugin loading is asynchronous. Listening is a separate phase the caller owns.

- **The build step owns build-time cleanup.** If any build step throws, the build step logs the failure, closes the instance it created (running its close hooks), and only then rethrows. A failed build never hands back a dangling instance: it either returns a ready instance or throws after closing whatever it started.

- **The caller forks cleanup on instance existence, not on the error.** Because a failed build self-cleans and rethrows without a return value, the caller observes "no instance" exactly when the build failed or never ran. **No instance** → cleanup already happened inside the build step, so the caller logs through the pre-instance fallback path and exits. **An instance exists** (build succeeded, listening failed) → the caller now owns it: log the failure, attempt to close it, and exit. The contract that falls out: a caller holding an instance may assume it is fully ready and safe to bind; a caller holding none may assume nothing was left dangling.

## Alternatives considered

- **Separate ports for application vs health/metrics/admin.** Rejected: requires configuration that does not exist (a second port plus a policy for which routes bind where) and splits the route surface across listeners for an isolation benefit a single-service deployment does not yet need. Revisitable as a new decision if an admin/metrics surface ever needs isolating.
- **Multiple bind addresses from one instance.** Rejected: adds an address dimension to startup and deployment with no configuration to drive it and no consumer needing more than one reachable address.
- **In-process HTTPS/HTTP2 listener (alongside or instead of plain HTTP).** Rejected: pulls certificate material and TLS lifecycle into the process and the environment contract. Terminating TLS upstream keeps the protocol simple and the configuration small; the in-process option stays available if the deployment model changes.
- **Two instances (e.g. one for the app, one for diagnostics).** Rejected: a second instance duplicates logging, lifecycle, and decoration for no benefit at this size, and doubles what shutdown and readiness must coordinate.
- **Single combined build-and-listen step.** Rejected: collapses two failure modes into one catch site, so the caller cannot distinguish a construction failure from a bind failure and must untangle cleanup by inspecting the error rather than by structure.
- **Caller owns all cleanup, including build failures.** The builder rethrows raw without closing; the caller closes whatever it gets. Rejected: on a build failure there is no instance to hand back, so the caller has nothing to close and the half-built instance leaks. Ownership must sit with whoever holds the reference — during the build, the build step.
- **Return the instance before readiness, let the caller await it.** Rejected: leaks the two-phase construction detail into every caller and reopens the cleanup question for a readiness failure, forcing the caller to close an instance it did not finish building.
- **Skip the explicit readiness await and rely on the listen call to flush pending loads.** Binding the port does trigger pending plugin loading, but folding readiness into listen re-merges the build-failure and listen-failure surfaces and defeats the split — rejected for the same reason as the combined step.

## Consequences

**Positive**

- **One address to know.** Health checks, future routes, and tooling all target one instance/port/listener — the simplest operational contract.
- **Configuration stays minimal.** The environment contract describes exactly the one port the listener needs; there is no unused second-port, host, or protocol configuration to keep coherent.
- **A returned instance is a ready instance.** Callers get one strong post-condition: if construction returned, every plugin is loaded and the instance is safe to bind. No caller re-checks readiness.
- **No dangling instance on a build failure.** Because the build step closes what it created before rethrowing, a construction failure cannot leak an open instance, no matter how far registration got.
- **Failure handling is structured, not error-sniffed.** The caller decides cleanup by whether an instance reference exists, giving the two phases two clearly separated catch behaviours.
- **Clean seam for testing and reuse.** A ready instance can be produced and exercised without binding a port, keeping construction independently testable. Lifecycle reasons about one listener, keeping startup and teardown small and unambiguous.

**Negative (accepted)**

- **No port-level isolation.** Health/metrics/admin traffic cannot be confined to a separate, less-exposed port; isolation, if needed, must come from the network layer or a future decision to split listeners.
- **No in-process TLS.** Serving HTTPS requires an upstream terminator; the application alone cannot present TLS.
- **Splitting later ripples.** Routing, configuration, and deployment all assume one address, so introducing a second port, address, or protocol later is a cross-cutting change — which is why the single-listener shape is recorded here rather than left implicit.
- **Cleanup logic is duplicated across the boundary.** Both the build step (build-time failures) and the caller (listen-time failures) carry a close-and-log path; the duplication is the price of splitting ownership cleanly.
- **Nested close-failure handling.** Each cleanup path guards against `close` itself throwing with an inner try/catch, so a close that fails during cleanup does not mask the original failure — more code than a single happy path.
- **The two-phase shape is a convention callers must respect.** Nothing in the type system forces a caller to treat "no instance" and "instance exists" differently; the split only pays off if every entry point follows it.

## Related

- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the fail-fast validation gate that runs before any instance exists and brands the port, so the listener binds an already-proven value rather than a raw primitive.
- [`./0010-logging-and-error-handling.md`](./0010-logging-and-error-handling.md) — the two-tier startup logger (the fallback path the caller uses on the no-instance failure) and the error normalization the build and listen failure paths log through.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module/helper boundary that situates the instance lifecycle and its supporting helpers.
- [`./0001-vite-multi-target-and-dev-runtime.md`](./0001-vite-multi-target-and-dev-runtime.md) — the dev runtime that starts this listener; the readiness boundary runs inside the process that runtime launches.
- [`../../CONTEXT.md`](../../CONTEXT.md) — **Load-bearing decision**, **Module**, and the **Rename test** this ADR is written to survive.
