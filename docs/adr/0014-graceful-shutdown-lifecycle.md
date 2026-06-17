# 0014. Signal-driven graceful shutdown: the single teardown funnel, the grace budget, and dev hot-reload handover

- **Status:** Accepted
- **Date:** 2026-06-17

## Context

Once the application binds its port and starts serving, it must also stop without dropping work or losing its last words. Standing that up forces several coupled decisions at once — they cannot be settled independently, because the wrong combination silently corrupts an exit path that only runs when something is already going wrong:

- **What ends the process.** A stop signal from the operating system, an unhandled error inside the runtime, and an explicit operator request are three distinct ways for the process to die, and each wants a different log severity. They must converge on one teardown path rather than each trapping the process its own way, or the drain-and-close logic forks at every site.
- **Who drains in-flight work.** Nothing in the framework converts an operating-system signal into an instance close on its own. Without a bridge, a stop signal hard-kills the process mid-request; with one, the framework's registered close hooks run and connections drain.
- **How long teardown is allowed to take.** Draining needs a bound, and that bound has to sit above the in-flight request timeout — so a request that started just under the limit can finish and its log line can flush — yet below the orchestrator's kill-grace window, so the process exits cleanly rather than being hard-killed. It is a different number, separately tuned, from the startup-side handover budgets the cooperative port handover owns.
- **How the final line survives the exit.** The teardown path's last line is a log line, so it inherits the destination-driven flush-before-exit rule the logging decision records — an asynchronous buffered destination must flush before exit, a synchronous one must not.
- **How the development edit-loop reloads.** The dev runtime keeps the process alive and swaps the module in memory. A reload that does not first close the previous in-memory instance leaks the single port owner and a teardown listener every cycle.

The readiness boundary, the validated record the instance was built from, the destination-driven flush rule, and the caught-value normalization that precedes every failure line are all inherited here, not restated — see Related.

## Decision

**All process teardown converges on one signal-driven orchestrator installed at build time that drains in-flight work and runs the framework's close hooks within a fixed grace budget, self-detaches via a close hook, and in development closes the previous in-memory instance before the new one accepts.** The unified stance has five facets.

- **One teardown funnel, installed once at build time.** A third-party graceful-shutdown orchestrator is installed as the instance is built and reacts to three classes of cause: the full enumerated operating-system signal set, an unhandled-error path, and an explicit manual trigger. Each cause emits one cause-specific log line at the right severity — error severity for a crash or unhandled error, info for an ordinary signal or the manual trigger — and then awaits the instance close, so every registered close hook runs exactly once down a single drain path. The funnel is the only thing that turns a cause into a close; future shutdown-sensitive resources participate by registering a close hook on the instance, never by trapping their own signal.

- **The teardown listener's lifetime is bound to the instance's lifetime.** The orchestrator handle is uninstalled from inside an instance close hook. The listener therefore self-detaches the moment the instance closes, and no detached listener survives a closed instance to act on a later signal. Lifetime coupling — not a manual teardown step the caller must remember — is what guarantees there is never a dangling handler.

- **A fixed grace budget bounds teardown.** One hard ceiling governs how long draining may take before the orchestrator force-exits. It is deliberately set above the in-flight request timeout, so a request admitted just under that timeout has headroom to complete and flush its line, and below the kill-grace window a typical orchestrator allows, so the process exits under its own control rather than being hard-killed. It is a distinct, separately-tuned number from the startup-side handover budgets the cooperative port handover owns — draining one's own requests and waiting on another process are different waits and must not share a constant.

- **The exit form follows the logger's destination.** The final teardown line obeys the destination-driven flush-before-exit rule the logging decision fixes: a logger backed by an asynchronous buffered destination flushes and exits from the flush callback, so the buffered final line lands before the process dies; a synchronous destination exits directly because the write has already landed. The orchestrator must not synchronously force-exit before that buffered final line has flushed.

- **Development hot-reload coordinates an in-memory instance handover.** When a hot-reload runtime is present, the shutdown setup reads the previous in-memory instance off the runtime's hot-data channel and closes it before accepting the new module, then stashes the new instance on that channel and accepts the update. A failed close of the predecessor is logged but swallowed, so a stuck predecessor never wedges the reload loop. When no hot-reload runtime is present — the production path — the whole handover is a strict no-op.

## Alternatives considered

- **Hand-rolled per-signal handlers.** Rejected: duplicates the drain/close/exit logic and the grace budget at every signal site and is easy to get subtly wrong — a double-close, a missed signal, an inconsistent severity. One funnel keeps that logic in a single, reviewable place.
- **Rely only on the framework's own close, with no signal bridge.** Rejected: nothing converts an operating-system signal into an instance close, so a stop signal hard-kills the process mid-request and the close hooks never run.
- **Leave the teardown listener installed for the whole process lifetime.** Rejected: a listener that outlives its instance can act on a signal after the instance is already gone. Binding the listener's lifetime to the instance via a close hook removes the dangling-handler hazard entirely.
- **No grace budget — force-close immediately.** Rejected: drops in-flight requests the request timeout would otherwise let finish, defeating the point of a graceful path.
- **Reuse the request timeout as the grace budget.** Rejected: leaves no headroom for a request admitted just under the timeout to complete and flush its final line — the drain would cut off exactly the request the timeout just admitted.
- **A single shared timeout for both teardown drain and startup handover.** Rejected: conflates draining one's own in-flight requests with waiting on a different process to release the port; the two waits have different correct values and are budgeted separately on purpose.
- **Synchronous process exit on the teardown path without waiting for the buffered flush.** Rejected: races the asynchronous destination's final write and intermittently loses the last fatal line — the exact failure the logging decision warns against.
- **Let a hot-reload cycle replace the module without closing the old instance.** Rejected: leaks a teardown listener and the single port owner every reload, until the new instance can no longer bind the port.
- **Full process restart instead of an in-memory hot-reload handover.** Rejected: loses the fast-feedback edit loop hot reload exists to provide.
- **Let a failed old-instance close abort the reload.** Rejected: a stuck predecessor would then block every further reload; logging the failure and continuing keeps development unblocked.

## Consequences

**Positive**

- **One convergence point for all teardown.** Every exit cause runs the same drain-and-close path, and every new shutdown-sensitive resource participates by registering a close hook — no new signal wiring per resource.
- **Severity-correct, distinguishable records.** A crash, an ordinary signal, and an operator-requested stop each log at the right level with a cause-specific message, so the three are tellable apart in the record after the fact.
- **No dangling handler.** The teardown listener cannot outlive the instance, so no stale handler can act on a signal after the instance is gone.
- **Bounded, headroom-aware draining.** In-flight requests have bounded headroom above the request timeout to finish, while teardown still completes inside a typical orchestrator's kill-grace, so the process exits under its own control.
- **No orphans across dev reloads, zero cost in production.** No orphaned instances or port owners accumulate across development reloads, and the production path has zero runtime effect because the hot-reload runtime is absent.

**Negative (accepted)**

- **A single third-party orchestrator sits on the critical exit path.** All teardown is centralised behind it, so a bug there affects every exit path at once rather than one site in isolation.
- **The enumerated signal set is a maintained surface.** The full list of trapped signals must stay in sync with the orchestrator's own signal vocabulary; a drift between the two is silent.
- **The grace budget is a magic number whose correctness is relational.** It is only correct while it stays above the request timeout below it and below the deployment's kill-grace above it; changing either neighbour silently invalidates it, with no compiler or test to catch the drift.
- **Flush-before-exit correctness is convention-enforced, not type-enforced.** Whether the teardown path waits for the flush depends on a logger destination property set far from the exit; nothing in the type system couples the two, so the discipline rests on review.
- **The hot-reload handover couples shutdown to the bundler's reload contract.** It depends on the dev runtime's hot-reload hooks and on an untyped hot-data channel carrying the previous instance — a convention anyone touching the reload path must respect, with no type to enforce the shape of what travels on that channel.

## Related

- [`./0015-remote-shutdown-channel.md`](./0015-remote-shutdown-channel.md) — the authenticated operator-triggered stop that drives this funnel's manual cause, draining after its own response rather than mid-request.
- [`./0016-cooperative-port-handover.md`](./0016-cooperative-port-handover.md) — the startup-side handover whose budgets are separately tuned from this teardown grace budget; the two waits must not share a constant.
- [`./0017-environment-contract-extensions.md`](./0017-environment-contract-extensions.md) — the validated record extensions the manual-trigger path reads from, carried on the same frozen environment the instance was built from.
- [`./0018-internal-control-plane-namespace.md`](./0018-internal-control-plane-namespace.md) — the internal namespace the manual-trigger surface lives behind, separated from the public route surface this teardown drains.
- [`./0011-single-port-server-lifecycle.md`](./0011-single-port-server-lifecycle.md) — the build-step readiness boundary and forked cleanup ownership this teardown unwinds; the orchestrator is installed inside that build step rather than as a bare readiness await.
- [`./0010-logging-and-error-handling.md`](./0010-logging-and-error-handling.md) — the destination-driven flush-before-exit rule every teardown exit form obeys, and the caught-value normalization every teardown log line flows through.
- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the fail-fast ethos and the validated record the instance was built from before teardown could matter.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module/helper boundary the shutdown capability sits behind, exposing a curated surface over its internal helpers.
- [`./0001-vite-multi-target-and-dev-runtime.md`](./0001-vite-multi-target-and-dev-runtime.md) — the dev runtime hosting the process that receives the signals, and the hot-reload cycle the in-memory handover coordinates.
- [`../logging/README.md`](../logging/README.md) — the level vocabulary and flush-before-exit rule the teardown log lines and final exit must stay consistent with.
- [`../../CONTEXT.md`](../../CONTEXT.md) — **Load-bearing decision**, **Module**, and the **Rename test** this ADR is written to survive.
