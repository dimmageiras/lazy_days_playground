# 0018. The internal control-plane namespace: separating privileged routes from observable ones on the one listener

- **Status:** Proposed
- **Date:** 2026-06-17

## Context

The server exposes its HTTP surface through one integrated listener — the single-listener decision settled that there is no second, less-exposed port to bind privileged traffic to. Adding a control-plane route (the first being remote shutdown) onto that one listener forces several coupled decisions at once: where a privileged route sits relative to the observable health check, how a reader tells the two apart, and where the privilege is actually enforced when the network layer offers no separation.

Several forces constrain the answer:

- The single-listener decision accepted, as a known price, that isolation can no longer come from a separate port — it must come from the app or network layer. A control-plane route inherits that constraint and must realise it concretely rather than re-litigate it.
- A privileged route and an observable route differ in kind: one is safe to expose and probe from anywhere, the other must never be reachable without passing a guard. That difference needs to be legible from the route's address, not buried in its handler.
- The health check already lives under a standalone prefix. Introducing a second prefix for control routes without aligning the first leaves two unrelated schemes where one coherent scheme would do.

## Decision

**The single listener's HTTP surface splits into a public observable health namespace and a reserved privileged internal namespace for app-guarded control-plane routes, expressing privilege in the path rather than at a separate port.** The unified stance has three facets.

- **Two named namespaces under the one listener.** A public observable namespace hosts the health route; a reserved privileged namespace hosts operational control routes, the first being the remote-shutdown endpoint. Both sit under the shared API segment on the single listener — no second instance, no second port. A route's privilege level is legible from which namespace it sits in: a reader sees the namespace segment and knows whether the route is safe to expose or must be guarded, without opening the handler.
- **Privilege is expressed in the path and enforced at the app layer.** Because the single-listener decision rules out a separate admin port, the privileged namespace realises that decision's accepted "isolation comes from the app or network layer" consequence as a concrete convention: the namespace segment marks intent, and the route's own guard — admission restricted to the loopback caller and a matching shared secret, both required — enforces it. The path says "this is privileged"; the guard makes it so. The namespace is not itself a security boundary — it is the reviewable signal that a security boundary is required here.
- **The health route relocates into the public namespace.** The health check moves under the shared public prefix so observable and control routes share one coherent prefix scheme rooted at the same API segment. This is an alignment increment, not a new isolation decision — the health check's behaviour and exposure are unchanged; only its address shifts so the two namespaces read as one deliberate scheme rather than two accidents.

## Alternatives considered

- **Put the control endpoint on a separate admin port.** Rejected by the single-listener decision, which already weighed and declined a second port; this branch realises the app-layer-isolation consequence that decision accepted instead. Revisitable as a new decision if an admin surface ever needs network-level isolation.
- **Mix control and observable routes in one undifferentiated namespace.** Rejected: a named privileged namespace makes a route's privilege legible from its path, where an undifferentiated namespace would force a reader to inspect each handler to learn whether it is exposed or guarded.
- **Keep health under its former standalone namespace.** Rejected in favour of the shared public prefix so the namespaces form one coherent scheme rooted at a common segment, rather than two unrelated prefixes that happen to coexist.
- **Rely on the route guard alone with no namespace convention.** Rejected: the namespace makes intent reviewable independently of whether a given route remembered to guard itself — a reviewer can flag a privileged-namespace route missing its guard, which a guard-only scheme gives no structural hook to catch.

## Consequences

**Positive**

- **Privilege is readable from the address.** A route's privilege level — control-plane versus observable — is visible from its namespace without inspecting its handler, so a reviewer and an operator can both reason about exposure from the path alone.
- **The accepted isolation cost gets a concrete shape.** The convention realises the single-listener decision's accepted app-layer-isolation consequence as a concrete, repeatable pattern that every future operational route follows, rather than each route inventing its own placement.
- **One operational address holds.** Health and control endpoints share the one listener and address the lifecycle decision promised, preserving the single operational contract — tooling still targets one place.

**Negative (accepted)**

- **Isolation is only as strong as the guard.** Privileged routes are isolated only by their app-layer guards; a guard regression exposes a control endpoint that a separate port would have isolated at the network layer. The namespace signals the requirement but cannot enforce it, and a route placed in the privileged namespace without its guard is reachable until a reviewer or test catches the omission.
- **Two namespace conventions to honour.** Two parallel namespace conventions now exist, and every future route must place itself into the correct one — a discipline the path scheme encourages but does not compel, so a misplaced route reads as the wrong privilege level until corrected.
- **Relocation breaks former callers.** Moving the health route under the shared public prefix breaks any external caller that addressed its former path; the alignment is worth the one-time break, but it is a break that every probe, monitor, and deployment manifest pointing at the old address must absorb.

## Related

- [`./0011-single-port-server-lifecycle.md`](./0011-single-port-server-lifecycle.md) — the single-listener, no-port-isolation decision whose accepted app-layer-isolation consequence this namespace convention realises.
- [`./0014-graceful-shutdown-lifecycle.md`](./0014-graceful-shutdown-lifecycle.md) — the shutdown lifecycle whose control surface this namespace hosts.
- [`./0015-remote-shutdown-channel.md`](./0015-remote-shutdown-channel.md) — the first privileged route the internal namespace hosts and the guard that enforces its isolation.
- [`./0016-cooperative-port-handover.md`](./0016-cooperative-port-handover.md) — the handover that addresses the privileged endpoint through this same namespace.
- [`./0017-environment-contract-extensions.md`](./0017-environment-contract-extensions.md) — the environment inputs the privileged route's guard reads.
- [`./0008-module-and-helper-organization.md`](./0008-module-and-helper-organization.md) — the module/helper boundary the namespaced routes register behind.
- [`../../CONTEXT.md`](../../CONTEXT.md) — **Load-bearing decision**, **Module**, and the **Rename test** this ADR is written to survive.
