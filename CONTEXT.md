# Context

**Purpose.** A glossary of project-specific terms. If a concept appears here, the definition below is canonical — do not invent a synonym, and do not redefine it inline in other docs. If a doc needs to bend a term, update this file in the same change.

The glossary is intentionally minimal at this stage. Add a term only when it has already surfaced in code, docs, or a recurring conversation — speculative terminology rots.

## Conventions

- Terms are listed alphabetically.
- Each term gets a one-sentence definition followed by a short clarifying note where useful.
- Cross-reference other terms by their exact spelling here (case-sensitive).
- New terms are added in the same change that introduces them to the codebase or docs.

## Terms

### Branch (Gel)

The database's unit of schema and data isolation — a named, independently-migratable line of schema together with its data, analogous to a database in other systems (older Gel/EdgeDB material may call it a "database"). Distinct from a **git branch**: a Gel branch is a runtime connection target the client selects, not a version-control line. The connection configuration names the one branch the client connects to.

### Composition layer

The calling relationship at the top of the application — the process entry / bootstrap that invokes the assembled application — rather than an encapsulated construct of its own. It validates environment input and runs any post-assembly startup steps around its call to the **Composition root**.

### Composition root

The stateless unit that assembles the running application — instantiating the server, wiring the modules together, registering the routes, and installing the lifecycle — and yields the assembled application. It is a helper, not a **Module**: it owns no internals to hide, only other capabilities to wire, so it follows the helper convention rather than the module shape (see [`docs/adr/0020-composition-root-is-a-helper.md`](./docs/adr/0020-composition-root-is-a-helper.md)). Invoked by the **Composition layer**.

### Control-plane route

A privileged operational route that acts on the running process itself — its lifecycle, configuration, or internals — rather than serving product or observable traffic, and that must never be reachable without passing a guard. Such routes sit under a reserved internal namespace whose path segment signals the privilege, but the namespace marks intent only: an app-layer guard, not the path, is the security boundary. Contrast with an **Observable route**, which is safe to expose and probe from anywhere. See also **Remote shutdown channel**.

### Cooperative port handover

A startup protocol in which an incoming instance, finding the configured port already held, asks the incumbent to vacate it — escalating through signals only if that request is refused — rather than failing fast or forcibly seizing the socket. The handover is _cooperative_ because the incumbent releases the port through its own teardown path before any escalation; it is distinct from kernel-level port sharing, where two listeners hold one port at once.

### Finding

A point-in-time record of what a code review surfaced when the matching plan was last run against current code. Findings live under `docs/code-reviews/findings/`. Findings are regenerated each time the plan is re-run; they are never amended in place. See also **Plan**.

### Grace budget

The fixed, bounded time a teardown orchestrator allows for in-flight work to drain and resources to close before it stops waiting and forces the process to exit. It is a single limit applied across the whole teardown, not a per-step timeout; choosing it trades the risk of dropping in-flight work against the certainty of eventually exiting. See also **Cooperative port handover**, whose startup-side handover budget is deliberately a separate value from this one.

### Load-bearing decision

A decision whose consequences propagate beyond the file it lives in — changing it would force changes elsewhere or break an unstated contract. Load-bearing decisions deserve an architectural decision record under `docs/adr/`; non-load-bearing decisions stay in code.

### Module

A self-contained unit that encapsulates one runtime capability and owns the internals that capability needs — its constants, helpers, types, and any routes — exposing only a curated public surface to the **Composition root** (invoked by the **Composition layer**) that wires modules together. A module hides how it works; consumers depend on what it exposes, not on how it is built. Contrast with a helper, a flat namespace of stateless utility functions that encapsulates nothing: a module may contain helpers, but a helper is never a module. Cross-cutting data contracts and environment input are concerns of the **Composition layer**, not modules.

### Module-level singleton

A state store whose lifetime is the application's — declared once at module scope, instantiated on first import, and consumed by importing the store directly without any provider plumbing. Appropriate for state that is genuinely global to the running process: UI flags, app-wide selections, session, theme, and anything else that does not vary by request, tenant, or route. Contrast with **Scoped store**.

### Observable route

A route that is safe to expose and probe from anywhere because it carries no privileged capability — a health check is the canonical example; it needs no guard and its address can be public. Contrast with a **Control-plane route**, which acts on the running process and must be guarded.

### Operational hint

A reference to a current file path, directory, or identifier inside an otherwise codebase-agnostic doc — labelled as movable. Operational hints help a reader locate the area in scope today; they are explicitly not the canonical definition of the area.

### Plan

A specification of what to check for one area of the codebase — scope, required skills, focus checklist, and triggers. Plans live under `docs/code-reviews/plans/`. Plans evolve as the area's responsibilities change. See also **Finding**.

### Pollution probe

The debug instrumentation that diffs `globalThis` keys, `process` listeners, and fake-timer state across each test boundary, plus Node active resources at the file boundary. Emits `[WARN]`, `[LEAK]`, and `[RISK]` lines on stderr when state survives where it shouldn't or when the runner contract the probe relies on is not met. Gated by an environment variable so the default test run stays quiet.

### Remote shutdown channel

An authenticated, loopback-only, single-shot HTTP route that lets a co-located caller trigger the process's teardown from outside the process. It is a **Control-plane route** whose guard admits only the loopback caller presenting the matching shared secret. _Single-shot_ means one accepted request arms the teardown exactly once, deduplicating that request's own completion events; the route is not served a second time because the teardown it triggers ends the process.

### Rename test

The codebase-agnostic check applied to documentation: if every file in the repo were renamed and reorganised tomorrow, would the doc still read correctly? Failing the rename test means the doc is over-coupled to current implementation and will rot at the next refactor.

### Scoped store

A state store whose lifetime is per-request, per-tenant, or per-route — built via a factory plus React context plus provider, then consumed through a fixed set of typed hooks. Contrast with **Module-level singleton**: a store that is genuinely global to the app, declared once at module scope, and consumed by importing the store directly.

### Spec

A test file matching the runner's `.spec.ts(x)` glob. Specs live next to source, not under a separate top-level test tree. See also [`docs/testing/README.md`](./docs/testing/README.md) for the full conventions.

### Stateless dispatcher

The contract every shared test helper follows: the helper module holds no state at module scope; any state is captured inside the closure of the function the helper exports. Required because the test runner reuses a single worker across files — module-level state in a helper would leak across every spec in the worker.

### Test data

The single `TEST_DATA` constant at the top of every spec. A per-spec `TEST_DATA` may reuse and compose from a shared, frozen cross-spec fixture bundle of common primitive values exposed through the setup factory. See [`docs/testing/README.md`](./docs/testing/README.md#test-data--the-test_data-constant) for the canonical shape, the shared-vs-per-spec dividing line, and the conventions.
