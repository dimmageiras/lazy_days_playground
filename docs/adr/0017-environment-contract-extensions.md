# 0017. Extending the environment contract: a prefixed cryptographic secret and a configurable bind address, premised on the server-only runtime

- **Status:** Accepted
- **Date:** 2026-06-17

## Context

Wiring a remote shutdown channel and a cooperative port handover into the existing validated configuration surface forces several coupled additions to the environment contract at once — and one of them tensions a guarantee an earlier decision made structural.

Several forces constrain the answer:

- The remote shutdown channel needs a credential to authenticate the request that asks the process to stand down. A credential is a cryptographic secret — exactly the category the environment-validation gate deliberately kept _off_ the prefixed bundler surface, so that no secret could leak into a client bundle by construction. Admitting one means re-examining why that exclusion held.
- The listener already binds the one validated port the environment contract carries, but the interface it binds is unspecified — left to a framework default. A single-listener decision earlier chose to carry no bind-address field at all. Standing the listener up under the validation discipline means making that bind interface an explicit, validated value rather than an implicit default.
- Whatever is added must obey the same discipline every other configuration value already obeys: proven present and well-shaped at the one fail-fast gate, branded so only schema output satisfies the consuming signatures, surfaced through the one frozen derived record, and read from the validated value — never from a raw primitive.
- The bind interface and the handover dial target are _not_ the same address. The listener must bind broadly to stay reachable on every interface, while the handover request is same-host and the control route admits only loopback callers — so the dial target is loopback, a fixed same-host address, not a second configured field. A bind-all interface includes loopback, so the loopback dial reaches the bound listener.

## Decision

**The validated prefixed environment contract gains its first cryptographic secret and an explicit bind-address dimension — both branded and fail-fast-validated through the one gate — accepting that the secret rides the prefixed surface only because no client runtime currently exists to leak it into.** The unified stance has four facets.

- **A cryptographic secret is admitted to the prefixed validated contract.** The remote-shutdown credential becomes a first-class environment field: validated as base64 of a documented minimum length that encodes an entropy floor, branded with its own nominal tag so a plain string cannot stand in for it, and surfaced to the application through the same frozen derived record as every other value. Secrets are no longer _categorically_ excluded from the prefixed surface — the earlier rule that all secrets stay unprefixed is relaxed for this one field. A secret may ride the validated contract precisely when the only runtime consuming that surface is the server.
- **The bind address becomes a validated, branded field; the handover dial is loopback by construction.** The server's listen interface is now an environment field validated against the IPv4 address format with its own refinement message and its own brand, surfaced through the same record alongside the port — so the listener binds a proven value rather than a framework default. The contract carries a bind-address dimension it did not before. The handover client does _not_ read that field: it dials loopback — a fixed same-host address — because the reclaim request is always same-host and the control route admits only loopback callers. Bind broad (reachable on every interface), dial loopback (same-host and guarded); a bind-all interface includes loopback, so the dial reaches the bound listener.
- **Both fields ride the existing fail-fast gate and branding discipline.** Each is proven present and well-shaped at boot, branded so only schema output satisfies the consuming signatures, and read from the validated record rather than from a raw primitive. A weak, malformed, or missing value fails at the gate — before any instance is built or any port is bound — rather than surfacing deep in the first request that needs it.
- **The safety of prefixing the secret is premise-bound and carries a revisit tripwire.** The exposure guarantee the environment-validation decision made structural — secrets cannot reach a client bundle because they never cross the prefix gate — is, for this one field, replaced by a topology premise: there is no browser bundle for the secret to leak into, because the only runtime built today is the server. This is not a permanent exception. Adding any client runtime later requires re-pointing this field off the prefixed surface _first_, before that runtime ships.

## Alternatives considered

- **Keep the secret unprefixed and read it from the raw process environment at the gate.** Rejected: bypasses the single prefixed contract, the brand, and the report-all-issues gate that is the one place configuration is proven — reintroducing exactly the lazy, scattered read the validation gate exists to prevent.
- **Inject the secret outside the schema through a separate secrets loader.** Rejected: creates a second configuration surface the gate does not own — the exact drift the environment-validation decision argues against.
- **Treat the prefixed-secret exposure as a non-issue permanently.** Rejected: the safety is premise-bound on there being no client bundle, so it carries a revisit tripwire rather than a blanket exception. Revisitable as a new decision only if the field is re-pointed off the prefixed surface when a client runtime arrives.
- **No minimum-length or base64 check on the secret.** Rejected: admits low-entropy credentials that weaken the value of the constant-time comparison the remote channel performs against the token.
- **Hard-code the bind and loopback address in startup code.** Rejected: unconfigurable across environments and untyped; a branded validated field keeps the address inside the gate, consistent with the read-only-from-the-validated-value rule the port already follows.
- **Keep no bind-address field and let the framework default the interface.** Rejected: the listener's bind interface would then be an implicit default outside the validation gate, the one place configuration is proven; an explicit, branded field keeps it read-only-from-the-validated-value like the port.
- **Validate the address as a generic string.** Rejected in favour of an IPv4-format refinement with a dedicated message and brand, matching the contract's branding discipline so the validated address is as load-bearing in the type system as every other field.
- **Dial the handover at the configured bind address instead of loopback.** Rejected: a bind-all address is a listen wildcard, not a routable destination, and any non-loopback dial would fail the control route's loopback-only guard. The handover always dials loopback — which a bind-all listener includes — so the bind address and the dial target are deliberately distinct.

## Consequences

**Positive**

- **Uniform treatment for both new fields.** The secret and the bind address get the same fail-fast validation, branding, and single-source-of-truth treatment as every other configuration value; consuming sites take a branded value, never a raw primitive.
- **Secret strength is enforced structurally.** Encoding, a length floor, and a brand enforce credential strength at the gate, rather than relying on operator habit to supply a strong value.
- **The dial needs no configuration.** The handover always dials loopback, so there is no second address field to keep coherent with the bind; the bind address stays configurable for reachability while the same-host dial is fixed by construction.
- **A reusable address seam.** The decision introduces a reusable address brand and validator that any future address field can adopt, and makes the listen interface an explicit, reviewable value rather than an implicit default buried in startup.

**Negative (accepted)**

- **The structural secret-exclusion guarantee is reversed for one field.** The environment-validation decision's guarantee that no secret crosses the prefix gate no longer holds for this field; its safety now rests on the server-only topology premise, and adding a client runtime later risks shipping the secret unless this field is re-pointed off the prefixed surface first.
- **A bind-address dimension the single-listener decision avoided.** That decision's "configuration stays minimal / no bind-address field" consequence is now overstated and is partially superseded here; the contract carries an address dimension it deliberately did not before.
- **The entropy relationship is split across two artifacts.** The link between the length floor and the random-byte count it encodes lives in sample documentation and a schema constant rather than as one named, enforced contract — a reader must reconcile the two to see why the floor is what it is.
- **The field name is narrower than the validation.** The naming suggests a bind-all address, but the validation accepts any valid IPv4 address, so the name promises less generality than the field actually permits.
- **Bind reachability and the loopback dial are coupled by an unstated assumption.** The handover's loopback dial reaches the listener only because the bind interface includes loopback, as a bind-all address does; pointing the bind field at a single non-loopback interface would leave the same-host handover unable to reach it.

## Related

- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the prefixed contract, branded outputs, and secrets-stay-unprefixed convention this ADR extends and, for the secret, knowingly tensions.
- [`./0011-single-port-server-lifecycle.md`](./0011-single-port-server-lifecycle.md) — the "configuration stays minimal / no bind-address field" facet this ADR partially supersedes by adding the address dimension.
- [`./0001-vite-multi-target-and-dev-runtime.md`](./0001-vite-multi-target-and-dev-runtime.md) — the multi-target build whose current server-only runtime is the premise that makes prefixing the secret safe.
- [`./0004-pnpm-dependency-stance.md`](./0004-pnpm-dependency-stance.md) — the precedent of a premise-bound relaxation carrying a revisit tripwire rather than a permanent exception.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — the validation wrapper that supplies the new brand and the address validator.
- [`./0014-graceful-shutdown-lifecycle.md`](./0014-graceful-shutdown-lifecycle.md) — the shutdown lifecycle this contract's secret and bind address serve.
- [`./0015-remote-shutdown-channel.md`](./0015-remote-shutdown-channel.md) — the route that consumes the branded credential this contract admits.
- [`./0016-cooperative-port-handover.md`](./0016-cooperative-port-handover.md) — the handover client that presents the branded credential and dials loopback to reach the locally-bound instance.
- [`./0018-internal-control-plane-namespace.md`](./0018-internal-control-plane-namespace.md) — the internal namespace the credential-bearing requests travel over.
- [`./0021-database-connection-contract.md`](./0021-database-connection-contract.md) — extends this decision's single premise-bound prefixed secret into a category, admitting the database admin credential on the same server-only premise and revisit tripwire.
- [`../../CONTEXT.md`](../../CONTEXT.md) — **Load-bearing decision** and the **Rename test** this ADR is written to survive.
