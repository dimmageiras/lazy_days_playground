# 0023. Test projects run in separate processes

- **Status:** Proposed
- **Date:** 2026-07-11

## Context

The suite is partitioned into more than one runner project — each with its own environment and file glob. A single runner invocation can execute those projects two ways: co-resident in one process, or as separate processes it launches and collates.

[ADR-0005](./0005-test-runner-worker-model.md) fixed the worker model at reused, non-isolated contexts (`isolate: false`) for startup speed, and framed its "no isolation" negative around a single project — state leaking across files within one worker. A second failure mode hides behind the same setting and appears only when more than one project shares a single runner process: the worker-global module substitutions the setup layer installs (the shared mocks) apply unreliably. A spec then binds to the real dependency instead of its mock — the substitution silently fails to take effect for that file — and the result is an order-dependent failure that reproduces only while the projects are co-resident and never when each project runs alone. The suite must settle, once, whether projects may share a process.

## Decision

Each test project runs in its own operating-system process. The suite never executes multiple projects co-resident in a single runner process: the scripts launch one process per project (through the package manager's parallel-run selector) and merge the results afterwards where a combined report is wanted. Any ad-hoc or watch-mode run is scoped to a single project for the same reason.

## Alternatives considered

- **Run every project in one runner invocation (the default when no project filter is given).** One command, and watch mode spans all projects at once. Rejected: under the `isolate: false` posture of ADR-0005 the co-resident projects share a worker module registry, the setup-layer mocks apply unreliably, and specs intermittently exercise the real dependency — a non-deterministic failure unique to this configuration.
- **Keep one process but enable isolation (`isolate: true`) for multi-project runs.** Rebuilding the module graph per file restores reliable substitution. Rejected: it discards the startup-speed trade ADR-0005 exists to make, and varying the isolation setting by invocation shape is its own maintenance hazard.
- **Leave it undecided and rely on habit.** The scripts already run projects separately, so nothing breaks today. Rejected: the reason is unrecorded, so a later "simplification" to a single all-projects invocation would reintroduce the flake with no signpost against it — the exact trap this record exists to close.

## Consequences

**Positive**

- Module substitution is reliable: with one project per process, the worker registry a project mutates is its own, so the setup-layer mocks always take effect.
- The posture composes with ADR-0005 instead of forcing an isolation setting that would undo its speed trade.
- The separate-process script shape now reads as a deliberate contract, not an incidental choice a cleanup might collapse.

**Accepted negatives**

- No single command runs the whole suite in one process; a combined report needs a per-project run plus a merge step.
- Watch mode cannot span every project at once — an all-projects watch invocation is the same co-resident configuration with the same hazard, so watch is scoped to one project.
- The contract lives in the shape of the scripts, not in a mechanical guard: invoking the bare runner with no project filter still co-locates the projects and can flake, so the discipline is "always select a project," held by convention and this record.

## Related

- [`./0005-test-runner-worker-model.md`](./0005-test-runner-worker-model.md) — the `isolate: false` worker-model posture whose per-process consequence this ADR records.
- [`./0006-test-setup-and-pollution-probe.md`](./0006-test-setup-and-pollution-probe.md) — the setup layer that installs the worker-global module mocks whose cross-project application this decision keeps reliable.
- [`../testing/README.md`](../testing/README.md) — the canonical testing conventions, which carry the operational "run projects as separate processes" rule.
