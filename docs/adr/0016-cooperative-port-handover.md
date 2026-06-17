# 0016. Cooperative port handover: the startup claim ladder, signal escalation, and its safety guardrails

- **Status:** Proposed
- **Date:** 2026-06-17

## Context

The server has exactly one configured port to bind, and the lifecycle decision that fixed that topology leaves no failover address to fall back to — the validated record carries one port, and that port is the single stable place tooling and health checks address. So when a previous process still holds the port at boot — a hot restart, an overlapping redeploy, a wedged predecessor — the bring-up path cannot route around the problem by picking another port; it must reclaim the exact one. Standing up that reclaim forces several coupled decisions at once.

Several forces constrain the answer:

- A bare listen between the build step and a successful bind fails fast on address-in-use — which means every hot restart while the old process lingers crashes startup and demands a manual port-kill. Recovering automatically requires a richer protocol than one syscall.
- Reclaiming the port two ways — asking the incumbent to leave, or signalling it — has very different costs and safety profiles. A graceful drain legitimately needs more time than a kernel socket release, and an immediate signal can fall on a process that has nothing to do with this server.
- The process that launched this one, and this process itself, can plausibly resolve as the port owner under a stale or confused lookup. Signalling either would take down the runtime hosting the reclaim.
- Two new instances can race to claim the same port at the same moment, each capable of stomping the other's just-won handover.

The reclaim composes against the authenticated remote-shutdown route, the validated branded credential and bind address from the environment contract, and the fail-fast-then-abort ethos the gate established — it does not restate those; it builds on them.

## Decision

**At boot the server claims its one configured port through an escalation ladder — try-listen, then a cooperative in-band shutdown request with bounded backoff polling, then a sibling re-probe, then an OS signal to the port owner with bounded polling, then abort — preferring graceful handover and refusing to signal itself, its parent, or a competing claimant.** The unified stance has five facets.

- **Claim the port through an escalation ladder, not a bare listen.** Boot first tries to listen; an address-in-use result is not a failure but the trigger for the protocol. The reclaim asks the incumbent to step down over the authenticated in-band route, polls the port back within the handover budget, re-probes for a competing claimant, escalates to an OS signal to the port owner, polls again within the force budget, and only then aborts. The protocol's success contract is structural: a return without throwing means the one integrated listener is bound to the configured port; any unrecoverable rung logs structured context and throws to abort startup, which the bootstrap path then reports and exits through.

- **Cooperative before forceful, with sibling-winner detection.** The first reclaim attempt is cooperative — a request to the incumbent to shut itself down — and only if that request is refused or the port is not released within the handover budget does the protocol escalate. Before signalling, a second cooperative probe is issued; if that probe is accepted, the new process aborts rather than killing, treating an accepting responder as a competing handover winner it must not stomp. Acceptance is never trusted on its own: an accepted request means the incumbent agreed to close, not that the socket is free, so the protocol still polls the listen before declaring success.

- **Phase-specific budgets and exponential backoff, not fixed sleeps.** Each phase is bounded by its own explicit timeout budget — a longer cooperative-handover budget versus a short post-signal force budget — because a graceful drain legitimately needs more time than a kernel socket release, and a single global timeout would be wrong for both. The poll interval starts small and grows by a fixed factor up to a cap, balancing chattiness against lag, and the cooperative request carries its own short request timeout so a stalled handshake cannot hang the phase. Every budget is named in one place, so restart latency is tuned in one reviewable edit rather than scattered across the helpers.

- **The forceful path resolves the owner's PID and signals the graceful-terminate signal, never a harder one.** The force rung looks up the PID that owns the configured port and sends `SIGTERM`, so the owner still gets a chance to close cleanly rather than being struck dead — the protocol forces the handover, it does not skip the drain. After signalling it polls the listen within the force budget before aborting, in case the port frees.

- **Refuse to signal self or parent, and surface typed failure reasons.** The protocol refuses to signal when the resolved owner is this process or the process that launched it, so it can never take down the runtime hosting the reclaim. A lookup that finds no owning process, a resolved owner that is self-or-parent, and a signal call that throws are three distinct typed failure reasons, each mapped to its own abort message — so an operator gets an actionable diagnosis instead of a generic "could not start" line.

## Alternatives considered

- **Fail-fast on address-in-use (the prior bare listen).** Rejected: every hot restart while the old process lingers crashes startup and forces a manual port-kill, the exact friction this protocol removes.
- **Pick a different free port when the configured one is busy.** Rejected: the single-validated-port contract means tooling, health checks, and the handover itself all assume one fixed address; a roaming port breaks every one of them.
- **Rely on an external supervisor to free the port before launch.** Rejected: it pushes lifecycle out of the app the dev runtime launches and adds an operational dependency the single-service model does not otherwise carry.
- **Signal/kill immediately on address-in-use with no cooperative request.** Rejected: it skips the incumbent's graceful close and can kill an unrelated process that happens to hold the port.
- **Send the hard-kill signal on the force path.** Rejected: it denies the owner any graceful close; the graceful-terminate signal lets the owner shut down cleanly even when forced off the port.
- **Cooperative request with an unbounded wait.** Rejected: a wedged incumbent would hang startup forever; the handover must be bounded by an explicit budget.
- **Trust the cooperative acceptance alone without re-polling the port.** Rejected: acceptance only means the incumbent agreed to close, not that the socket has actually been released.
- **No sibling re-probe before signalling.** Rejected: two new instances starting at once could each stomp the other's just-won handover; the second probe makes the loser abort instead of entering a kill war.
- **No self/parent-PID guard.** Rejected: the reclaim could signal the launching runtime or this process itself, taking down the toolchain that is trying to start the server.
- **A single global timeout for all phases.** Rejected: it cannot reflect that a cooperative handover legitimately needs far longer than a post-signal socket release.
- **Fixed-interval polling.** Rejected: too chatty when the interval is short, too laggy when it is long; capped exponential backoff balances both.
- **Boolean success/failure with no reason.** Rejected: the orchestrator could not produce an actionable abort; a typed reason set drives distinct, diagnosable messaging per failure.
- **Wrap the HTTP client behind a project-owned seam like the other libraries.** Not done: the handover uses one HTTP client directly at a single call site, and the wrapper-seam discipline is knowingly not extended to it here — accepting that a future second consumer has no choke-point. Revisitable as a new decision if a second call site appears.

## Consequences

**Positive**

- **Restarts recover automatically.** Hot restarts and overlapping redeploys recover on their own instead of crashing on address-in-use, while the configured port stays the one stable address the lifecycle decision promised — no port roaming.
- **Graceful before forceful.** The cooperative path is always tried before any forceful one, so the incumbent gets to close cleanly whenever it can.
- **The startup race is deterministic.** When two new instances contend, the loser aborts and the winner keeps the port — a defined outcome rather than a kill war.
- **The reclaim cannot turn on itself.** The protocol cannot self-terminate the launching runtime or this process, and each escalation rung logs structured context, so a stuck handover is diagnosable from the logs.
- **Bounded, tunable boot.** Worst-case boot time is bounded and explicit per phase, and restart-latency tuning is a one-file change to named constants.

**Negative (accepted)**

- **Startup is no longer a single syscall.** It can take up to the cooperative budget plus the force budget before deciding to abort, and it pulls several helpers, two modules, and an HTTP round-trip into the boot path that must stay in sync.
- **The cooperative path needs a cooperating peer.** It only works against an incumbent that honours the same handshake and shares the credential; an older or unrelated process holding the port degrades to a signal-kill or an abort.
- **Correctness leans on the OS lookup.** A stale or empty port-to-PID lookup degrades to a no-owner abort even when something is really holding the port, and the graceful-terminate signal may simply be ignored by a wedged owner.
- **The budgets are environment-sensitive guesses.** A slow machine or a heavy-draining incumbent could exceed the handover budget and abort a restart that would eventually have succeeded.
- **One call site diverges from the wrapper seam.** Using one HTTP client directly at the call site breaks the wrapper-seam discipline, so a future second consumer has no choke-point and a library swap is no longer a single-file change.
- **The capability is broadly coupled.** Startup now depends on the remote-shutdown route, the credential, the bind address, and the signal set — a change to any of them ripples into this protocol.

## Related

- [`./0014-graceful-shutdown-lifecycle.md`](./0014-graceful-shutdown-lifecycle.md) — the shutdown lifecycle whose cooperative-close contract the incumbent honours when it steps down for the handover.
- [`./0015-remote-shutdown-channel.md`](./0015-remote-shutdown-channel.md) — the authenticated route the cooperative rung calls and whose acceptance contract the protocol depends on.
- [`./0017-environment-contract-extensions.md`](./0017-environment-contract-extensions.md) — the validated, branded credential and bind address this protocol composes its dial target from.
- [`./0018-internal-control-plane-namespace.md`](./0018-internal-control-plane-namespace.md) — the internal control-plane namespace the cooperative shutdown route lives under, separating it from product routes.
- [`./0011-single-port-server-lifecycle.md`](./0011-single-port-server-lifecycle.md) — the single-validated-port topology that leaves no failover port, so reclaiming the exact port is the only option; this protocol replaces the bare listen between build and a successful bind.
- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the fail-fast-then-abort ethos the protocol's unrecoverable rungs follow.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — the wrapper-seam discipline this protocol's direct HTTP-client use knowingly diverges from at one call site.
- [`./0004-pnpm-dependency-stance.md`](./0004-pnpm-dependency-stance.md) — the exact-pin posture the runtime dependencies this protocol adds follow.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module/helper boundary the claim ladder and its helpers sit behind.
- [`../../CONTEXT.md`](../../CONTEXT.md) — **Load-bearing decision**, **Module**, and the **Rename test** this ADR is written to survive.
