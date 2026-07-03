# 0021. The database connection contract: connection configuration and a second prefixed secret on the validated surface

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

Standing up a database client behind the server pulls a cluster of connection settings — host, port, branch, client TLS mode, an admin credential, and a logging label — into configuration. Three forces shape where they live.

- The application only reads configuration from the bundler-injected surface behind the `VITE_APP_` prefix, proven once at the fail-fast gate and branded. Connection settings the app consumes must obey that same discipline or they reintroduce the scattered, unvalidated reads that gate exists to prevent.
- One of the settings is an admin credential — a cryptographic secret. The environment-validation decision kept secrets _off_ the prefixed surface by construction; a later decision relaxed that for a single field, the remote-shutdown token, premised on there being no client runtime to leak into. A database password is a _second_ secret asking for the same treatment, which turns a one-field exception into a category.
- The same values are needed by parties that do not read the app's surface at all. The container is configured by Docker Compose, which wants the server's native `GEL_SERVER_*` names. The host database CLI — used for branch and migration work from a developer machine — reads only its own `GEL_*` names. Neither reads `VITE_APP_`-prefixed variables.

## Decision

**The database connection configuration joins the one validated prefixed contract as `VITE_APP_DB_*` fields — branded and fail-fast-validated like every other field — and the admin credential rides that prefixed surface as a second premise-bound secret. A single env file feeds all three consumers, each bridging from the `VITE_APP_DB_*` names its own way.** The stance has three facets.

- **The connection fields are first-class validated contract members.** Host, port, branch, client TLS mode, and the logging label are validated at the one gate, each branded with its own nominal tag, and surfaced through the same frozen derived record every other value uses; the client is built from the validated record, never from raw primitives. The host is validated as an IPv4 address or hostname and normalized to lower case so the stored value is canonical.
- **A second cryptographic secret is admitted to the prefixed surface, on the same premise.** The admin credential is validated and branded like the rest and rides the `VITE_APP_` surface. This extends the earlier single-field relaxation into a category, and inherits its premise and tripwire unchanged: it is safe only because the sole runtime consuming the surface is the server, and adding any client runtime later requires re-pointing every prefixed secret off the surface _first_.
- **One env file, three bridges.** The `VITE_APP_DB_*` names are the single source. Docker Compose interpolates them and maps them onto the container's native `GEL_SERVER_*` names — interpolation is name-agnostic, so the prefix is harmless. The app reads the validated values and passes them to the client explicitly. The host CLI, which understands only `GEL_*` names, is fed by loading the file and swapping the `VITE_APP_DB_` prefix for `GEL_`. A container-only setting the app never consumes stays on the file for Compose but out of the schema — the non-strict contract drops it rather than demanding a consumer.

## Alternatives considered

- **Keep the database settings unprefixed and read them from the raw process environment.** Rejected: bypasses the single validated contract, the brand, and the report-all gate — the exact scattered read the environment-validation decision exists to prevent — and splits configuration across two surfaces.
- **Name the variables with the database tool's native `GEL_*` names so the host CLI reads them directly.** Rejected: those names never cross the `VITE_APP_` prefix gate, so the app could not read them and the validated contract would not own them. The prefix-swap at CLI load time is cheaper than forfeiting the gate.
- **Keep the admin password unprefixed as a special case while prefixing the rest.** Rejected: it would fracture the connection config across two surfaces and re-open the scattered-read problem for the one field most worth validating; the server-only premise already justifies prefixing the first secret, and a second changes nothing about that premise.
- **Put the container-only security-mode field in the schema too, for uniformity.** Rejected: the app never consumes it, so a required schema key would fail the gate for a value no application code reads; the non-strict contract is designed to let such a Compose-only variable ride the file without becoming a validated key.
- **Validate the host as a generic non-empty string.** Rejected: an unparseable host would then surface only when the client fails to connect, deep past the gate; an IPv4-or-hostname refinement keeps the failure at boot, consistent with the contract's fail-fast discipline.

## Consequences

**Positive**

- The connection settings get the same fail-fast validation, branding, and single-source-of-truth treatment as every other configuration value; consuming sites take branded values, never raw primitives.
- One env file is authoritative for the container, the app, and the host CLI, so there is no second configuration surface to keep coherent.
- The host is stored canonically (lower-cased), so downstream comparisons and connection strings do not depend on how an operator happened to type it.

**Negative (accepted)**

- The structural secret-exclusion guarantee, already reversed for one field, is now reversed for a category of prefixed secrets; the safety of all of them rests on the same server-only topology premise, and adding a client runtime later risks shipping them unless they are re-pointed off the prefixed surface first.
- The bridge is a naming coupling held by discipline: the prefix-swap that feeds the host CLI assumes the `VITE_APP_DB_*` names map cleanly onto the CLI's `GEL_*` names, and a field whose native name does not follow that pattern would need special handling.
- A container-only variable lives on the shared file but outside the validated contract, so a reader must know the schema deliberately drops it rather than assume every entry in the file is validated.

## Related

- [`./0009-environment-validation-gate.md`](./0009-environment-validation-gate.md) — the prefixed contract, branded outputs, non-strict schema, and secrets-stay-unprefixed convention this ADR extends.
- [`./0017-environment-contract-extensions.md`](./0017-environment-contract-extensions.md) — the first premise-bound prefixed secret; this ADR turns that single-field relaxation into a category on the same server-only premise and revisit tripwire.
- [`./0007-library-wrapper-seam.md`](./0007-library-wrapper-seam.md) — the validation wrapper that supplies the brands and the host validator.
- [`./0001-vite-multi-target-and-dev-runtime.md`](./0001-vite-multi-target-and-dev-runtime.md) — the current server-only runtime that is the premise making the prefixed secret safe.
- [`../db/db-initialize.md`](../db/db-initialize.md) — the local-development runbook that documents the three-consumer bridge in operational terms.
